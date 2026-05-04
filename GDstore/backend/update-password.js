const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công');

    // Tìm admin
    const admin = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!admin) {
      console.log('❌ Không tìm thấy tài khoản admin');
      return;
    }

    console.log('📝 Tài khoản hiện tại:', {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      password: admin.password
    });

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    // Cập nhật mật khẩu
    admin.password = hashedPassword;
    await admin.save();

    console.log('✅ Đã cập nhật mật khẩu thành công!');
    console.log('🔐 Mật khẩu mới đã được mã hóa');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Mật khẩu: 123456');
    
    // Kiểm tra lại
    const updatedAdmin = await User.findOne({ where: { email: 'admin@example.com' } });
    console.log('\n📊 Kiểm tra mật khẩu:');
    
    // Thử so sánh mật khẩu
    const isMatch = await updatedAdmin.comparePassword('123456');
    console.log('✅ So sánh mật khẩu "123456":', isMatch ? 'ĐÚNG' : 'SAI');
    
    const isMatchWrong = await updatedAdmin.comparePassword('123');
    console.log('❌ So sánh mật khẩu "123":', isMatchWrong ? 'ĐÚNG' : 'SAI (đúng rồi)');

  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    process.exit();
  }
}

updateAdminPassword();