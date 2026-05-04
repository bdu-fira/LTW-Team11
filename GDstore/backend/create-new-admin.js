const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createNewAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    // Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Tạo admin mới
    const newAdmin = await User.create({
      name: 'Admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin'
    });

    console.log('✅ Đã tạo tài khoản admin mới thành công!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mật khẩu: 123456');
    console.log('👤 Role: admin');
    
    // Kiểm tra đăng nhập
    const testLogin = await newAdmin.comparePassword('123456');
    console.log('\n🔐 Kiểm tra đăng nhập:', testLogin ? '✅ OK' : '❌ Lỗi');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit();
  }
}

createNewAdmin();