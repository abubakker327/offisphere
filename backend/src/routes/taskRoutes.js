// backend/src/routes/taskRoutes.js
const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Helper: attach assignee and creator names
 */
async function enrichTasks(records) {
  if (!records || records.length === 0) return [];

  const userIds = new Set();
  records.forEach((t) => {
    if (t.assignee_id) userIds.add(t.assignee_id);
    if (t.created_by) userIds.add(t.created_by);
  });

  const ids = Array.from(userIds);
  if (ids.length === 0) return records;

  const { data: users, error } = await supabase
    .from('users')
    .select('id, full_name')
    .in('id', ids);

  if (error) {
    console.error('enrichTasks users error:', error);
    return records;
  }

  const map = {};
  (users || []).forEach((u) => {
    map[u.id] = u.full_name;
  });

  return records.map((t) => ({
    ...t,
    assignee_name: t.assignee_id ? map[t.assignee_id] || '' : '',
    created_by_name: t.created_by ? map[t.created_by] || '' : ''
  }));
}

/**
 * POST /api/tasks
 * Admin/Manager creates a task
 * body: { title, description, assignee_id, priority, due_date }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    const userId = req.user.id;
    const {
      title,
      description,
      assignee_id,
      priority = 'medium',
      due_date
    } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ message: 'Title is required' });
    }

    try {
      const { error: insertError } = await supabase
        .from('tasks')
        .insert({
          title,
          description: description || null,
          priority,
          assignee_id: assignee_id || null,
          due_date: due_date || null,
          created_by: userId
        });

      if (insertError) {
        console.error('Create task error:', insertError);
        return res.status(400).json({
          message:
            insertError.message || 'Error creating task'
        });
      }

      // Return updated list for convenience
      const tasks = await listTasksForUser(req.user);
      res.status(201).json(tasks);
    } catch (err) {
      console.error('Create task catch error:', err);
      res
        .status(500)
        .json({ message: 'Error creating task' });
    }
  }
);

/**
 * Helper: list tasks based on role
 * - admin/manager: all tasks
 * - employee: tasks where assignee_id = user.id OR created_by = user.id
 */
async function listTasksForUser(userPayload) {
  const userId = userPayload.id;
  const roles = userPayload.roles || [];
  const isAdminOrManager =
    roles.includes('admin') || roles.includes('manager');

  let query = supabase
    .from('tasks')
    .select(
      'id, title, description, status, priority, assignee_id, created_by, due_date, created_at'
    )
    .order('created_at', { ascending: false });

  if (!isAdminOrManager) {
    query = query.or(
      `assignee_id.eq.${userId},created_by.eq.${userId}`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('List tasks error:', error);
    throw error;
  }

  return enrichTasks(data || []);
}

/**
 * GET /api/tasks
 */
router.get(
  '/',
  authenticate,
  authorize([]),
  async (req, res) => {
    try {
      const tasks = await listTasksForUser(req.user);
      res.json(tasks);
    } catch (err) {
      console.error('List tasks catch error:', err);
      res
        .status(500)
        .json({ message: 'Error fetching tasks' });
    }
  }
);

/**
 * PATCH /api/tasks/:id/status
 * Assignee OR admin/manager can update status
 * body: { status }
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize([]),
  async (req, res) => {
    const taskId = req.params.id;
    const { status } = req.body;

    if (
      !['todo', 'in_progress', 'done', 'blocked'].includes(
        status
      )
    ) {
      return res.status(400).json({
        message:
          "Status must be one of: 'todo', 'in_progress', 'done', 'blocked'"
      });
    }

    try {
      const userId = req.user.id;
      const roles = req.user.roles || [];
      const isAdminOrManager =
        roles.includes('admin') || roles.includes('manager');

      // Check ownership / permission
      const { data: existing, error: getError } = await supabase
        .from('tasks')
        .select('id, assignee_id, created_by')
        .eq('id', taskId)
        .single();

      if (getError || !existing) {
        console.error(
          'Get task before status update error:',
          getError
        );
        return res
          .status(404)
          .json({ message: 'Task not found' });
      }

      const isAssignee = existing.assignee_id === userId;
      const isCreator = existing.created_by === userId;

      if (!isAdminOrManager && !isAssignee && !isCreator) {
        return res.status(403).json({
          message:
            'You are not allowed to update this task status'
        });
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', taskId);

      if (updateError) {
        console.error(
          'Update task status error:',
          updateError
        );
        return res.status(400).json({
          message:
            updateError.message ||
            'Error updating task status'
        });
      }

      const tasks = await listTasksForUser(req.user);
      res.json(tasks);
    } catch (err) {
      console.error('Update task status catch error:', err);
      res.status(500).json({
        message: 'Error updating task status'
      });
    }
  }
);

/**
 * PUT /api/tasks/:id
 * Admin/manager can edit task details
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    const taskId = req.params.id;
    const {
      title,
      description,
      status,
      priority,
      assignee_id,
      due_date
    } = req.body;

    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined)
        updateData.description = description;
      if (status !== undefined)
        updateData.status = status;
      if (priority !== undefined)
        updateData.priority = priority;
      if (assignee_id !== undefined)
        updateData.assignee_id = assignee_id;
      if (due_date !== undefined)
        updateData.due_date = due_date;

      const { error: updateError } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId);

      if (updateError) {
        console.error('Update task error:', updateError);
        return res.status(400).json({
          message:
            updateError.message || 'Error updating task'
        });
      }

      const tasks = await listTasksForUser(req.user);
      res.json(tasks);
    } catch (err) {
      console.error('Update task catch error:', err);
      res
        .status(500)
        .json({ message: 'Error updating task' });
    }
  }
);

/**
 * DELETE /api/tasks/:id
 * Admin/manager only
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    const taskId = req.params.id;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Delete task error:', error);
        return res.status(400).json({
          message:
            error.message || 'Error deleting task'
        });
      }

      const tasks = await listTasksForUser(req.user);
      res.json(tasks);
    } catch (err) {
      console.error('Delete task catch error:', err);
      res
        .status(500)
        .json({ message: 'Error deleting task' });
    }
  }
);

module.exports = router;
