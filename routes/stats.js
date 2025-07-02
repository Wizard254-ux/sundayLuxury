// routes/stats.js
import express from 'express';
import Appointment from '../models/Appointment.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const approved = await Appointment.countDocuments({ status: 'approved' });
    const pending = await Appointment.countDocuments({ status: 'pending' });
    const cancelled = await Appointment.countDocuments({ status: 'cancelled' });

    const uniqueClients = await Appointment.distinct('phone'); // assuming 'phone' is unique per client

    res.json({
      totalAppointments,
      approved,
      pending,
      cancelled,
      totalClients: uniqueClients.length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;
