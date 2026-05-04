const sequelize = require('./config/database');
const Product = require('./models/Product');
const User = require('./models/User');
const Cart = require('./models/Cart');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    console.log('🔄 Bắt đầu seed dữ liệu...');
    
    // Đồng bộ database - tạo bảng nếu chưa có
    await sequelize.sync({ alter: true });
    console.log('✅ Đồng bộ database thành công');

    // Kiểm tra và tạo users
    const userCount = await User.count();
    console.log(`👤 Số user hiện tại: ${userCount}`);
    
    if (userCount === 0) {
      console.log('🔄 Đang tạo tài khoản...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      
      await User.create({
        name: 'Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      });

      await User.create({
        name: 'Nguyễn Văn A',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user'
      });

      console.log('✅ Đã tạo tài khoản');
    } else {
      console.log('ℹ️ Tài khoản đã tồn tại');
    }

    // Kiểm tra và tạo products
    const productCount = await Product.count();
    console.log(`📦 Số sản phẩm hiện tại: ${productCount}`);
    
    if (productCount === 0) {
      console.log('🔄 Đang thêm sản phẩm mẫu...');

      const products = [
        {
          name: 'Nồi cơm điện Sharp 1.8L',
          description: 'Nồi cơm điện cao cấp với công nghệ nấu 3D, lòng nồi chống dính',
          price: 1250000,
          category: 'nha-bep',
          brand: 'Sharp',
          stock: 50,
          images: JSON.stringify(['/uploads/rice-cooker-1.jpg']),
          specifications: JSON.stringify({
            'Dung tích': '1.8L',
            'Công suất': '700W',
            'Bảo hành': '24 tháng'
          })
        },
        {
          name: 'Tivi Samsung 4K 55 inch',
          description: 'Tivi Samsung UHD 4K, Smart TV, kết nối Internet',
          price: 15900000,
          category: 'dien-tu',
          brand: 'Samsung',
          stock: 20,
          images: JSON.stringify(['/uploads/TV.jpg']),
          specifications: JSON.stringify({
            'Kích thước': '55 inch',
            'Độ phân giải': '4K UHD',
            'Cổng kết nối': 'HDMI x3, USB x2'
          })
        },
        {
          name: 'Máy lạnh Daikin 1.5HP',
          description: 'Máy lạnh tiết kiệm điện inverter, lọc không khí',
          price: 8900000,
          category: 'dien-tu',
          brand: 'Daikin',
          stock: 15,
          images: JSON.stringify(['/uploads/ac-1.jpg']),
          specifications: JSON.stringify({
            'Công suất': '1.5HP',
            'Công nghệ': 'Inverter',
            'Gas': 'R32'
          })
        },
        {
          name: 'Bộ sofa phòng khách',
          description: 'Bộ sofa da cao cấp màu nâu, khung gỗ tự nhiên',
          price: 12500000,
          category: 'phong-khach',
          brand: 'HomeFurniture',
          stock: 10,
          images: JSON.stringify(['/uploads/sofa-1.jpg']),
          specifications: JSON.stringify({
            'Chất liệu': 'Da cao cấp',
            'Khung': 'Gỗ tự nhiên',
            'Kích thước': '2.2m x 0.8m x 0.9m'
          })
        },
        {
          name: 'Tủ lạnh LG 300L',
          description: 'Tủ lạnh Inverter tiết kiệm điện, ngăn đá trên',
          price: 8900000,
          category: 'nha-bep',
          brand: 'LG',
          stock: 25,
          images: JSON.stringify(['/uploads/fridge-1.jpg']),
          specifications: JSON.stringify({
            'Dung tích': '300L',
            'Công nghệ': 'Inverter',
            'Tiêu thụ điện': '0.9 kW/ngày'
          })
        },
        {
          name: 'Máy giặt Panasonic 9kg',
          description: 'Máy giặt cửa trước, công nghệ giặt bọt khí',
          price: 10500000,
          category: 'dien-tu',
          brand: 'Panasonic',
          stock: 12,
          images: JSON.stringify(['/uploads/washer-1.jpg']),
          specifications: JSON.stringify({
            'Khối lượng giặt': '9kg',
            'Công nghệ': 'Inverter',
            'Tốc độ vắt': '1400 vòng/phút'
          })
        }
      ];

      for (const product of products) {
        await Product.create(product);
      }

      console.log('✅ Đã thêm sản phẩm mẫu');
    } else {
      console.log('ℹ️ Sản phẩm đã tồn tại');
    }

    // Kiểm tra lại tổng số
    const finalUserCount = await User.count();
    const finalProductCount = await Product.count();

    console.log('\n🎉 HOÀN TẤT!');
    console.log('📊 Thống kê:');
    console.log(`   - Users: ${finalUserCount} tài khoản`);
    console.log(`   - Products: ${finalProductCount} sản phẩm`);
    console.log('\n👤 Tài khoản đăng nhập:');
    console.log('   Admin: admin@example.com / 123456');
    console.log('   User: user@example.com / 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

seedData();