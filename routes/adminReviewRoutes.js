// routes/adminReviewRoutes.js - New file for admin routes
const express = require('express');
const router = express.Router();
const {
  getAllReviewsForAdmin,
  deleteAllReviews,
  deleteMultipleReviews,
  toggleReviewApproval,
  toggleReviewVisibility,
  getAdminStats,
  deleteReview
} = require('../controllers/reviewController');

// Simple authentication middleware (replace with your actual auth)
const adminAuth = (req, res, next) => {
  // For now, just pass through
  // In production, add proper authentication like:
  // const token = req.headers.authorization;
  // if (!token || !validateAdminToken(token)) {
  //   return res.status(401).json({ message: 'Unauthorized' });
  // }
  next();
};

// Admin routes
router.get('/all', adminAuth, getAllReviewsForAdmin);
router.delete('/delete-all', adminAuth, deleteAllReviews);
router.delete('/delete-multiple', adminAuth, deleteMultipleReviews);
router.patch('/:id/toggle-approval', adminAuth, toggleReviewApproval);
router.patch('/:id/toggle-visibility', adminAuth, toggleReviewVisibility);
router.get('/stats', adminAuth, getAdminStats);

module.exports = router;