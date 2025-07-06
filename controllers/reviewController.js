// controllers/reviewController.js
import Review from '../models/Review.js';
// Get all approved reviews
export const getReviews = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ 
      isApproved: true, 
      isVisible: true 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('-__v');

    const totalReviews = await Review.countDocuments({ 
      isApproved: true, 
      isVisible: true 
    });

    const averageRating = await Review.getAverageRating();

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      },
      averageRating: averageRating.averageRating,
      totalReviews: averageRating.totalReviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Create a new review
export const createReview = async (req, res) => {
  try {
    const { name, treatment, review, rating } = req.body;

    // Validation
    if (!name || !treatment || !review || !rating) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Create new review
    const newReview = new Review({
      name: name.trim(),
      treatment: treatment.trim(),
      review: review.trim(),
      rating: parseInt(rating),
      isApproved: true // Auto-approve for now, you can change this for moderation
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: savedReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Get a single review by ID
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

// Update review (admin only)
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Delete review (admin only)
export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Get reviews statistics
export const getReviewStats = async (req, res) => {
  try {
    const stats = await Review.aggregate([
      {
        $match: { isApproved: true, isVisible: true }
      },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating' },
          ratingCounts: {
            $push: '$rating'
          }
        }
      },
      {
        $addFields: {
          ratingDistribution: {
            $reduce: {
              input: { $range: [1, 6] },
              initialValue: {},
              in: {
                $mergeObjects: [
                  '$$value',
                  {
                    $arrayToObject: [
                      [
                        {
                          k: { $toString: '$$this' },
                          v: {
                            $size: {
                              $filter: {
                                input: '$ratingCounts',
                                cond: { $eq: ['$$this', '$$item'] }
                              }
                            }
                          }
                        }
                      ]
                    ]
                  }
                ]
              }
            }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats[0] || { totalReviews: 0, averageRating: 0, ratingDistribution: {} }
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics',
      error: error.message
    });
  }
};

export const getAllReviewsForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Higher limit for admin
    const skip = (page - 1) * limit;

    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');

    const totalReviews = await Review.countDocuments({});

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all reviews for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Delete all reviews
export const deleteAllReviews = async (req, res) => {
  try {
    const result = await Review.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `All reviews deleted successfully. ${result.deletedCount} reviews removed.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting all reviews',
      error: error.message
    });
  }
};

// Delete multiple reviews
export const deleteMultipleReviews = async (req, res) => {
  try {
    const { reviewIds } = req.body;
    
    if (!reviewIds || !Array.isArray(reviewIds) || reviewIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of review IDs'
      });
    }

    const result = await Review.deleteMany({ 
      _id: { $in: reviewIds } 
    });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} reviews deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error deleting multiple reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting reviews',
      error: error.message
    });
  }
};

// Toggle review approval status
export const toggleReviewApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isApproved = !review.isApproved;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${review.isApproved ? 'approved' : 'unapproved'} successfully`,
      data: review
    });
  } catch (error) {
    console.error('Error toggling review approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review approval status',
      error: error.message
    });
  }
};

// Toggle review visibility
export const toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.isVisible = !review.isVisible;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${review.isVisible ? 'made visible' : 'hidden'} successfully`,
      data: review
    });
  } catch (error) {
    console.error('Error toggling review visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating review visibility',
      error: error.message
    });
  }
};

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    const totalReviews = await Review.countDocuments({});
    const approvedReviews = await Review.countDocuments({ isApproved: true });
    const visibleReviews = await Review.countDocuments({ isVisible: true });
    const recentReviews = await Review.countDocuments({ 
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
    });

    const avgRating = await Review.aggregate([
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const ratingDistribution = await Review.aggregate([
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalReviews,
        approvedReviews,
        visibleReviews,
        recentReviews,
        averageRating: avgRating[0]?.avgRating || 0,
        ratingDistribution: ratingDistribution.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin statistics',
      error: error.message
    });
  }
};