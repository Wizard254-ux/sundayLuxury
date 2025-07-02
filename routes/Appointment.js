// routes/Appointment.js
import express from 'express';
import Appointment from '../models/Appointment.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Nodemailer config (still included if needed later)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// BOOK appointment
router.post('/', async (req, res) => {
  const { name, phone, email, service, date, time } = req.body;

  if (!name || !phone || !email || !Array.isArray(service) || service.length === 0 || !date || !time) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  const selectedDate = new Date(date);
  const today = new Date();
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 6);

  today.setHours(0, 0, 0, 0);
  selectedDate.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);

  if (selectedDate < today || selectedDate > maxDate) {
    return res.status(400).json({ message: 'Appointment must be within 7 days.' });
  }

  try {
    const newAppointment = new Appointment({ name, phone, email, service, date, time, status: 'pending' });
    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment: newAppointment });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET all appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// UPDATE appointment (without Twilio)
router.put('/:id', async (req, res) => {
  const { status } = req.body;

  if (!['approved', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  try {
    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: 'Appointment not found' });

    res.json({ message: 'Status updated', appointment: updated });
  } catch (error) {
    res.status(500).json({ message: 'Update error', error: error.message });
  }
});

export default router;
