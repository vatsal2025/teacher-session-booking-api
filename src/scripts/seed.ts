import mongoose from 'mongoose';
import { config } from '../config/env';
import { Teacher } from '../models/Teacher';

// Seeds one sample teacher so sessions can be created right away.
async function seed(): Promise<void> {
  await mongoose.connect(config.mongoUri);
  const existing = await Teacher.findOne({ email: 'ananya.sharma@example.com' });
  if (existing) {
    console.log('Teacher already exists:', existing._id.toString());
  } else {
    const teacher = await Teacher.create({
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      specialization: 'Mathematics',
      experience: 5,
    });
    console.log('Seeded teacher:', teacher._id.toString());
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
