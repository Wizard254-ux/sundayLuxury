// routes/reviewRoutes.js
import express from 'express';
 const router = express.Router();
import {
  getReviews,
  createReview,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewStats,
  getAllReviewsForAdmin,
  deleteAllReviews,
  deleteMultipleReviews,
  toggleReviewApproval,
  toggleReviewVisibility,
  getAdminStats
} from '../controllers/reviewController.js';


// Middleware for input validation and sanitization
const validateReviewInput = (req, res, next) => {
  const { name, treatment, review, rating } = req.body;
  
  // Sanitize inputs
  if (name) req.body.name = name.trim();
  if (treatment) req.body.treatment = treatment.trim();
  if (review) req.body.review = review.trim();
  if (rating) req.body.rating = parseInt(rating);
  
  next();
};

// Rate limiting middleware (optional - you can use express-rate-limit)
import rateLimit from 'express-rate-limit';

const createReviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    message: 'Too many reviews submitted. Please try again later.'
  }
});

// Public routes
router.get('/', getReviews);
router.post('/', validateReviewInput, createReview);
router.get('/stats', getReviewStats);
router.get('/:id', getReviewById);

// Admin routes (you should add authentication middleware)
// router.put('/:id', authenticateAdmin, updateReview);
// router.delete('/:id', authenticateAdmin, deleteReview);

// For now, these are unprotected - ADD AUTHENTICATION MIDDLEWARE
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

// Admin routes
router.get('/admin/all', getAllReviewsForAdmin);
router.delete('/admin/delete-all', deleteAllReviews);
router.delete('/admin/delete-multiple', deleteMultipleReviews);
router.patch('/admin/:id/toggle-approval', toggleReviewApproval);
router.patch('/admin/:id/toggle-visibility', toggleReviewVisibility);
router.get('/admin/stats', getAdminStats);



export default router