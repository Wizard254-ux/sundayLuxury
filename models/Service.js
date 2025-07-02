// models/Service.js
import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  images: { type: [String], required: true }
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

export default Service;
