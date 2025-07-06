// models/Review.js
import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  treatment: {
    type: String,
    required: [true, 'Treatment is required'],
    trim: true,
    enum: [
      'Signature Facial',
      'Deep Tissue Massage',
      'Couples Retreat',
      'Aromatherapy',
      'Hot Stone Massage',
      'Body Wrap',
      'Manicure & Pedicure',
      'Other'
    ]
  },
  review: {
    type: String,
    required: [true, 'Review text is required'],
    trim: true,
    minlength: [10, 'Review must be at least 10 characters long'],
    maxlength: [1000, 'Review cannot exceed 1000 characters']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  isApproved: {
    type: Boolean,
    default: false // For moderation purposes
  },
  isVisible: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for efficient querying
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ isApproved: 1, isVisible: 1 });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString();
});

// Method to get average rating
reviewSchema.statics.getAverageRating = async function() {
  const pipeline = [
    {
      $match: { isApproved: true, isVisible: true }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || { averageRating: 0, totalReviews: 0 };
};

export default mongoose.model('Review', reviewSchema);