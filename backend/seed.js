const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const admins = [
  { name: 'Super Admin', email: 'superadmin@civicpulse.in', password: 'super@2026', department: null },
  { name: 'Sanitation Admin', email: 'sanitation@civicpulse.in', password: 'sanitation@2026', department: 'Sanitation' },
  { name: 'Roads Admin', email: 'roads@civicpulse.in', password: 'roads@2026', department: 'Roads' },
  { name: 'Water Admin', email: 'water@civicpulse.in', password: 'water@2026', department: 'Water' },
  { name: 'Electricity Admin', email: 'electricity@civicpulse.in', password: 'electricity@2026', department: 'Electricity' },
  { name: 'Municipal Admin', email: 'municipal@civicpulse.in', password: 'municipal@2026', department: 'Municipal' },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    for (const admin of admins) {
      const exists = await User.findOne({ email: admin.email });
      if (exists) {
        console.log(`⚠️  Already exists: ${admin.email}`);
        continue;
      }
      const hashed = await bcrypt.hash(admin.password, 10);
      await User.create({
        name: admin.name,
        email: admin.email,
        password: hashed,
        role: 'admin',
        department: admin.department
      });
      console.log(`✅ Created: ${admin.email}`);
    }

    console.log('\n🎉 All admin accounts ready!');
    console.log('\nAdmin credentials:');
    admins.forEach(a => console.log(`  ${a.email} → ${a.password}`));
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();