// routes/Appointment.js
import express from 'express';
import Appointment from '../models/Appointment.js';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Updated Nodemailer config with your email settings
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_SERVER || 'smtp.gmail.com',
  port: process.env.MAIL_PORT || 587,
  secure: process.env.MAIL_USE_SSL === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.MAIL_USERNAME || 'cu.kibabiiuniversity@gmail.com',
    pass: process.env.MAIL_PASSWORD || 'fuzs zitu xjxh tcck'
  },
  tls: {
    rejectUnauthorized: false // This helps with some Gmail configurations
  }
});

// Function to send approval email
const sendApprovalEmail = async (appointment) => {
  try {
    const mailOptions = {
      from: {
        name: process.env.MAIL_SENDER_NAME || 'Project Manager Firm',
        address: process.env.MAIL_USERNAME || 'cu.kibabiiuniversity@gmail.com'
      },
      to: appointment.email,
      subject: 'Appointment Approved - Confirmation Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #28a745; text-align: center;">🎉 Appointment Approved!</h2>
          
          <p>Dear <strong>${appointment.name}</strong>,</p>
          
          <p>We are pleased to inform you that your appointment has been <strong>approved</strong> and confirmed!</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Appointment Details:</h3>
            <p><strong>📅 Date:</strong> ${new Date(appointment.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>⏰ Time:</strong> ${appointment.time}</p>
            <p><strong>🔧 Services:</strong> ${appointment.service.join(', ')}</p>
            <p><strong>📞 Contact:</strong> ${appointment.phone}</p>
          </div>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">Important Notes:</h4>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Please arrive on time for your appointment</li>
              <li>If you need to reschedule, please contact us at least 24 hours in advance</li>
              <li>Contact us if you have any questions or concerns</li>
            </ul>
          </div>
          
          <p>We look forward to serving you and providing excellent service during your appointment.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>${process.env.MAIL_SENDER_NAME || 'Project Manager Firm'}</strong><br>
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Approval email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error: error.message };
  }
};

// Function to send cancellation email
const sendCancellationEmail = async (appointment) => {
  try {
    const mailOptions = {
      from: {
        name: process.env.MAIL_SENDER_NAME || 'Project Manager Firm',
        address: process.env.MAIL_USERNAME || 'cu.kibabiiuniversity@gmail.com'
      },
      to: appointment.email,
      subject: 'Appointment Cancelled - Notification',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #dc3545; text-align: center;">❌ Appointment Cancelled</h2>
          
          <p>Dear <strong>${appointment.name}</strong>,</p>
          
          <p>We regret to inform you that your appointment has been <strong>cancelled</strong>.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0;">Cancelled Appointment Details:</h3>
            <p><strong>📅 Date:</strong> ${new Date(appointment.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
            <p><strong>⏰ Time:</strong> ${appointment.time}</p>
            <p><strong>🔧 Services:</strong> ${appointment.service.join(', ')}</p>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Need to reschedule?</strong><br>
              Please contact us to book a new appointment at your convenience.
            </p>
          </div>
          
          <p>We apologize for any inconvenience this may cause and look forward to serving you in the future.</p>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 14px;">
              Best regards,<br>
              <strong>${process.env.MAIL_SENDER_NAME || 'Project Manager Firm'}</strong><br>
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Cancellation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return { success: false, error: error.message };
  }
};

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

// UPDATE appointment (with email notifications)
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

    // Send email notification based on status
    let emailResult = { success: true };

    if (status === 'approved') {
      emailResult = await sendApprovalEmail(updated);
    } else if (status === 'cancelled') {
      emailResult = await sendCancellationEmail(updated);
    }

    // Return response with email status
    const response = {
      message: `Appointment ${status} successfully`,
      appointment: updated,
      emailSent: emailResult.success
    };

    if (!emailResult.success) {
      response.emailError = emailResult.error;
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ message: 'Update error', error: error.message });
  }
});

export default router;
