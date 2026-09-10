const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { initDatabase } = require('./config/db');
const submissionRoutes = require('./routes/submissionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Liveness / Readiness Health Check (for Kubernetes Probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'three-tier-backend-api',
  });
});

// Root API Info
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the 3-Tier Form Submission Backend API',
    endpoints: {
      health: 'GET /health',
      getSubmissions: 'GET /api/submissions',
      createSubmission: 'POST /api/submissions',
      deleteSubmission: 'DELETE /api/submissions/:id',
    },
  });
});

// Routes
app.use('/api/submissions', submissionRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

// Start Server and initialize Database
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend server running on http://0.0.0.0:${PORT}`);
      console.log(`Health check: http://0.0.0.0:${PORT}/health`);
      console.log(`Submissions API: http://0.0.0.0:${PORT}/api/submissions`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
