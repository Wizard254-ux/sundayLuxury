import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const router = express.Router();

// Admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: { id: admin._id, email: admin.email },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Hardcoded Update Route (debug only)
router.put('/update', async (req, res) => {
  const { currentEmail, currentPassword, newPassword, newEmail } = req.body;

  // Hardcoded (temporary)
  //const hardcodedEmail = "admin@spa.com";
  //const hardcodedPassword = "admin123";

  // Check credentials
  //if (currentEmail !== hardcodedEmail || currentPassword !== hardcodedPassword) {
    //return res.status(400).json({ message: 'Incorrect current email or password (hardcoded)' });
  //}

  try {
    const admin = await Admin.findOne({ email: currentEmail });
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // Update password if provided
    if (newPassword) {
      const hashed = await bcrypt.hash(newPassword, 10);
      admin.password = hashed;
    }

    // Update email if provided
    if (newEmail) {
      admin.email = newEmail;
    }

    await admin.save();
    res.json({ message: 'Credentials updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update admin' });
  }
});

// Optional: Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const existing = await Admin.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashed });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to register admin' });
  }
});

export default router;
