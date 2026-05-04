require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const sequelize = require('./config/database');

const app = express();

// Cấu hình session
app.use(session({
  secret: 'homestore_secret_2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// CORS - dynamic cho phép localhost và tất cả link ngrok
app.use(cors({
  origin: function (origin, callback) {
    // Cho phép request không có origin (như Postman, curl)
    if (!origin) return callback(null, true);

    // Cho phép localhost (chạy trên máy bạn)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // Cho phép tất cả link ngrok-free.dev
    if (origin.includes('ngrok-free.dev')) {
      return callback(null, true);
    }

    // Nếu không thỏa mãn điều kiện nào -> chặn
    callback(null, false);
  },
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/delivery-proofs', express.static(path.join(__dirname, 'uploads/delivery-proofs')));

// Routes API
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/users', require('./routes/users'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reviews', require('./routes/reviews'));

// Test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API đang chạy!' });
});

// ========== SERVE REACT BUILD (TỰ ĐỘNG TÌM ĐƯỜNG DẪN) ==========
let buildPath = null;

// Thử các đường dẫn khả thi
const possiblePaths = [
  path.join(__dirname, '../frontend/build'),  // C:\@Store\frontend\build
  path.join(__dirname, '../build'),            // C:\@Store\build
  path.join(__dirname, 'build'),               // C:\@Store\backend\build
  'C:\\@Store\\frontend\\build',               // Đường dẫn tuyệt đối 1
  'C:\\@Store\\build',                         // Đường dẫn tuyệt đối 2
];

for (const tryPath of possiblePaths) {
  if (fs.existsSync(tryPath)) {
    buildPath = tryPath;
    break;
  }
}

if (!buildPath) {
  console.error('❌ KHÔNG TÌM THẤY THƯ MỤC BUILD!');
  console.error('Đã tìm tại các đường dẫn:');
  possiblePaths.forEach(p => console.error(`  - ${p}`));
  console.error('');
  console.error('👉 Hãy chạy lệnh: cd C:\\@Store\\frontend && npm run build');
  process.exit(1);
}

console.log(`✅ Đang serve React build từ: ${buildPath}`);

// Serve static files từ thư mục build
app.use(express.static(buildPath));

// Tất cả các request không phải API đều trả về index.html (cho React Router)
app.get('*', (req, res) => {
  // Nếu request bắt đầu bằng /api thì bỏ qua (đã có route xử lý)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // Trả về index.html cho React Router
  res.sendFile(path.join(buildPath, 'index.html'));
});
// ========== KẾT THÚC ==========

// Auto-migration: thêm cột mới và mở rộng ENUM nếu chưa có
const runMigrations = async () => {
  try {
    // Mở rộng ENUM role trong bảng users (thêm 'shipper')
    await sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'shipper') NOT NULL DEFAULT 'user'
    `).catch(() => {}); // bỏ qua nếu đã tồn tại

    // Mở rộng ENUM status trong bảng orders (thêm 'delivery_confirmed', 'out_for_delivery')
    await sequelize.query(`
      ALTER TABLE orders MODIFY COLUMN status
      ENUM('pending','processing','shipped','out_for_delivery','delivery_confirmed','delivered','cancelled')
      NOT NULL DEFAULT 'pending'
    `).catch(() => {});

    // Thêm cột shipperId nếu chưa có
    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN shipperId INT NULL,
      ADD CONSTRAINT fk_shipper FOREIGN KEY (shipperId) REFERENCES users(id) ON DELETE SET NULL
    `).catch(() => {});

    // Thêm cột deliveryProofImage nếu chưa có
    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN deliveryProofImage VARCHAR(500) NULL
    `).catch(() => {});

    // Thêm cột deliveryNote nếu chưa có
    await sequelize.query(`
      ALTER TABLE orders ADD COLUMN deliveryNote TEXT NULL
    `).catch(() => {});

    // Thêm các cột cho tính năng đăng ký shipper
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN shipperRegistrationStatus ENUM('none', 'pending', 'rejected') NOT NULL DEFAULT 'none'
    `).catch(() => {});
    await sequelize.query(`
      ALTER TABLE users ADD COLUMN shipperApplicationData TEXT NULL
    `).catch(() => {});

    console.log('✅ Migration hoàn tất');
  } catch (err) {
    console.warn('⚠️ Migration warning:', err.message);
  }
};

// Khởi động server
const PORT = 5000;
sequelize.sync().then(async () => {
  console.log('✅ Database connected');
  await runMigrations();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`✅ Ngrok ready: ngrok http ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Database connection failed:', err);
});