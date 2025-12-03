// backend/src/routes/documentRoutes.js
const express = require('express');
const supabase = require('../supabaseClient');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * GET /api/documents
 * Everyone logged in can see documents (for now).
 * Later we can add visibility filters.
 */
router.get('/', authenticate, authorize([]), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('documents')
      .select(
        'id, title, category, description, file_url, visibility, uploaded_by, created_at'
      )
      .order('created_at', { ascending: false });

    if (error) {
      console.error('List documents error:', error);
      return res
        .status(500)
        .json({ message: 'Error fetching documents' });
    }

    res.json(data || []);
  } catch (err) {
    console.error('List documents catch error:', err);
    res.status(500).json({ message: 'Error fetching documents' });
  }
});

/**
 * POST /api/documents
 * Admin + Manager can create documents
 * body: { title, category, description, file_url, visibility }
 */
router.post(
  '/',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    const {
      title,
      category,
      description,
      file_url,
      visibility = 'company'
    } = req.body;

    if (!title) {
      return res
        .status(400)
        .json({ message: 'Title is required' });
    }

    try {
      const uploaded_by = req.user.id;

      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          title,
          category: category || null,
          description: description || null,
          file_url: file_url || null,
          visibility,
          uploaded_by
        });

      if (insertError) {
        console.error('Create document error:', insertError);
        return res.status(400).json({
          message:
            insertError.message || 'Error creating document'
        });
      }

      const { data, error: listError } = await supabase
        .from('documents')
        .select(
          'id, title, category, description, file_url, visibility, uploaded_by, created_at'
        )
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('List documents after create error:', listError);
        return res
          .status(500)
          .json({ message: 'Error fetching documents' });
      }

      res.status(201).json(data || []);
    } catch (err) {
      console.error('Create document catch error:', err);
      res.status(500).json({ message: 'Error creating document' });
    }
  }
);

/**
 * PUT /api/documents/:id
 * Admin + Manager can update documents
 */
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    const docId = req.params.id;
    const {
      title,
      category,
      description,
      file_url,
      visibility
    } = req.body;

    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (category !== undefined)
        updateData.category = category || null;
      if (description !== undefined)
        updateData.description = description || null;
      if (file_url !== undefined)
        updateData.file_url = file_url || null;
      if (visibility !== undefined)
        updateData.visibility = visibility;

      const { error: updateError } = await supabase
        .from('documents')
        .update(updateData)
        .eq('id', docId);

      if (updateError) {
        console.error('Update document error:', updateError);
        return res.status(400).json({
          message:
            updateError.message || 'Error updating document'
        });
      }

      const { data, error: listError } = await supabase
        .from('documents')
        .select(
          'id, title, category, description, file_url, visibility, uploaded_by, created_at'
        )
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('List documents after update error:', listError);
        return res
          .status(500)
          .json({ message: 'Error fetching documents' });
      }

      res.json(data || []);
    } catch (err) {
      console.error('Update document catch error:', err);
      res.status(500).json({ message: 'Error updating document' });
    }
  }
);

/**
 * DELETE /api/documents/:id
 * Admin + Manager can delete documents
 */
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'manager']),
  async (req, res) => {
    const docId = req.params.id;

    try {
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', docId);

      if (error) {
        console.error('Delete document error:', error);
        return res.status(400).json({
          message:
            error.message || 'Error deleting document'
        });
      }

      const { data, error: listError } = await supabase
        .from('documents')
        .select(
          'id, title, category, description, file_url, visibility, uploaded_by, created_at'
        )
        .order('created_at', { ascending: false });

      if (listError) {
        console.error('List documents after delete error:', listError);
        return res
          .status(500)
          .json({ message: 'Error fetching documents' });
      }

      res.json(data || []);
    } catch (err) {
      console.error('Delete document catch error:', err);
      res.status(500).json({ message: 'Error deleting document' });
    }
  }
);

module.exports = router;
