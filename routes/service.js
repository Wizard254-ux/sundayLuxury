// routes/service.js
import express from 'express';
import multer from 'multer';
import Service from '../models/Service.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});

const upload = multer({ storage });

// POST: Create service
router.post('/', upload.array('images'), async (req, res) => {
  const { title, description, price } = req.body;
  const imageFiles = req.files;

  if (!title || !description || !price || imageFiles.length === 0) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const imagePaths = imageFiles.map(file => `/uploads/${file.filename}`);
    const newService = new Service({ title, description, price, images: imagePaths });
    await newService.save();
    res.status(201).json({ message: 'Service added successfully', service: newService });
  } catch (error) {
    res.status(500).json({ message: 'Error adding service', error: error.message });
  }
});

// GET: All services
router.get('/', async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching services', error: error.message });
  }
});

// GET: Single service by ID
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: 'Service not found' });
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching service', error: error.message });
  }
});

// PUT: Update service
router.put('/:id', async (req, res) => {
  const { title, description, price } = req.body;

  try {
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { title, description, price },
      { new: true }
    );
    if (!updatedService) return res.status(404).json({ message: 'Service not found.' });
    res.json({ message: 'Service updated successfully', service: updatedService });
  } catch (error) {
    res.status(500).json({ message: 'Error updating service', error: error.message });
  }
});

// DELETE: Delete service
router.delete('/:id', async (req, res) => {
  try {
    await Service.findByIdAndDelete(req.params.id);
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting service', error: error.message });
  }
});

export default router;
