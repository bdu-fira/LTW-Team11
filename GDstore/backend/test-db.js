const sequelize = require('./config/database');
const Product = require('./models/Product');

async function testConnection() {
  try {
    // Kiểm tra kết nối
    await sequelize.authenticate();
    console.log('✅ Kết nối database thành công!');
    
    // Kiểm tra model Product
    console.log('✅ Model Product:', Product.name);
    
    // Đếm số sản phẩm
    const count = await Product.count();
    console.log(`✅ Số sản phẩm trong database: ${count}`);
    
    // Lấy danh sách sản phẩm
    const products = await Product.findAll();
    console.log('✅ Danh sách sản phẩm:');
    products.forEach(p => {
      console.log(`   - ${p.id}: ${p.name} - ${p.price}đ`);
    });
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  }
}

testConnection();