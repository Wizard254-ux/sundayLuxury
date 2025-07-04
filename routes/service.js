// routes/service.js
import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Service from '../models/Service.js';
import dotenv from 'dotenv';
dotenv.config();

const router = express.Router();

// Debug environment variables
console.log('Environment variables:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY);
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'Present' : 'Missing');

// Configure Cloudinary with explicit error handling
try {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  console.log('Cloudinary configured successfully');
} catch (error) {
  console.error('Cloudinary configuration error:', error);
}

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'services', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1000, height: 1000, crop: 'limit' }, // Resize large images
      { quality: 'auto' } // Auto optimize quality
    ]
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// POST: Create service
router.post('/', upload.array('images'), async (req, res) => {
  const { title, description, price } = req.body;
  const imageFiles = req.files;

  if (!title || !description || !price || imageFiles.length === 0) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    // Extract Cloudinary URLs from uploaded files
    const imagePaths = imageFiles.map(file => file.path);
    
    const newService = new Service({ 
      title, 
      description, 
      price, 
      images: imagePaths 
    });
    
    await newService.save();
    res.status(201).json({ 
      message: 'Service added successfully', 
      service: newService 
    });
  } catch (error) {
    // Clean up uploaded images if service creation fails
    if (imageFiles && imageFiles.length > 0) {
      for (const file of imageFiles) {
        try {
          await cloudinary.uploader.destroy(file.filename);
        } catch (cleanupError) {
          console.error('Error cleaning up image:', cleanupError);
        }
      }
    }
    res.status(500).json({ 
      message: 'Error adding service', 
      error: error.message 
    });
  }
});

// GET: All services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching services', 
      error: error.message 
    });
  }
});

// GET: Single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json(service);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching service', 
      error: error.message 
    });
  }
});

// PUT: Update service (with optional image update)
router.put('/:id', upload.array('images'), async (req, res) => {
  const { title, description, price } = req.body;
  const imageFiles = req.files;

  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // Prepare update data
    const updateData = { title, description, price };

    // If new images are uploaded, update images
    if (imageFiles && imageFiles.length > 0) {
      // Delete old images from Cloudinary
      for (const oldImageUrl of service.images) {
        try {
          // Extract public_id from Cloudinary URL
          const publicId = oldImageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`services/${publicId}`);
        } catch (deleteError) {
          console.error('Error deleting old image:', deleteError);
        }
      }

      // Add new images
      updateData.images = imageFiles.map(file => file.path);
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json({ 
      message: 'Service updated successfully', 
      service: updatedService 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error updating service', 
      error: error.message 
    });
  }
});

// DELETE: Delete service
router.delete('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found.' });
    }

    // Delete images from Cloudinary
    for (const imageUrl of service.images) {
      try {
        // Extract public_id from Cloudinary URL
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`services/${publicId}`);
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
      }
    }

    // Delete service from database
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting service', 
      error: error.message 
    });
  }
});

export default router;
