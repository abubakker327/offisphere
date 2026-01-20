// backend/src/index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const taskRoutes = require('./routes/taskRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const documentRoutes = require('./routes/documentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reimbursementRoutes = require('./routes/reimbursementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const leadRoutes = require('./routes/leadRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const salesRoutes = require('./routes/salesRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const recognitionRoutes = require('./routes/recognitionRoutes');
const emailRoutes = require('./routes/emailRoutes');
const exportRoutes = require('./routes/exportRoutes');
const reportRoutes = require('./routes/reportRoutes');
const salesAccountsRoutes = require('./routes/salesAccountsRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1);
app.use(
  cors({
    origin: (origin, callback) => {
      const defaultOrigins =
        process.env.NODE_ENV === 'production'
          ? 'https://offisphere.vercel.app'
          : 'http://localhost:3000,http://127.0.0.1:3000,https://offisphere.vercel.app';

      const allowed = (process.env.CORS_ORIGINS || defaultOrigins)
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!origin || allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({ message: 'Offisphere backend running' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reimbursements', reimbursementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/recognitions', recognitionRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/sa', salesAccountsRoutes);

// generic error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Offisphere backend running on port ${PORT}`);
});
