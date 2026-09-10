const { pool } = require('../config/db');

// @desc    Get all form submissions
// @route   GET /api/submissions
exports.getSubmissions = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, category, message, created_at FROM submissions ORDER BY created_at DESC'
    );
    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions from database.',
      error: error.message,
    });
  }
};

// @desc    Create new form submission
// @route   POST /api/submissions
exports.createSubmission = async (req, res) => {
  try {
    const { full_name, email, phone, category, message } = req.body;

    // Basic Validation
    if (!full_name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Full Name, Email, and Message are required fields.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    const insertQuery = `
      INSERT INTO submissions (full_name, email, phone, category, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

    const values = [
      full_name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      category ? category.trim() : 'General',
      message.trim(),
    ];

    const result = await pool.query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: 'Form submitted and saved to database successfully!',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error creating submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to save submission to database.',
      error: error.message,
    });
  }
};

// @desc    Delete a submission by ID
// @route   DELETE /api/submissions/:id
exports.deleteSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM submissions WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: `Submission with ID ${id} not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Submission #${id} deleted successfully.`,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete submission.',
      error: error.message,
    });
  }
};
