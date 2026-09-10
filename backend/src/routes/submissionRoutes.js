const express = require('express');
const router = express.Router();
const {
  getSubmissions,
  createSubmission,
  deleteSubmission,
} = require('../controllers/submissionController');

router.route('/')
  .get(getSubmissions)
  .post(createSubmission);

router.route('/:id')
  .delete(deleteSubmission);

module.exports = router;
