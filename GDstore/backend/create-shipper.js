// Script tạo tài khoản shipper
// Chạy: node create-shipper.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

const createShipper = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    // Cập nhật ENUM trước
    await sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'shipper') NOT NULL DEFAULT 'user'
    `).catch(err => console.log('ENUM already updated:', err.message));

    const email = 'shipper@gdstore.com';
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('⚠️  Shipper đã tồn tại:', email);
      console.log('   Password: shipper123');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('shipper123', 10);
    const shipper = await User.create({
      name: 'Shipper GD Store',
      email,
      password: hashedPassword,
      role: 'shipper',
      phone: '0909000000',
      isActive: true
    });

    console.log('✅ Tạo tài khoản shipper thành công!');
    console.log('   Email:', email);
    console.log('   Password: shipper123');
    console.log('   ID:', shipper.id);
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  }
};

createShipper();
