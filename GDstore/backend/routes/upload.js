const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Upload ảnh sản phẩm
router.post('/product', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Upload ảnh thành công'
    });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ message: 'Lỗi upload ảnh' });
  }
});

// Upload nhiều ảnh
router.post('/products', upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Không tìm thấy file' });
    }

    const imageUrls = req.files.map(file => `/uploads/${file.filename}`);
    res.json({
      success: true,
      images: imageUrls,
      message: 'Upload ảnh thành công'
    });
  } catch (error) {
    console.error('Lỗi upload:', error);
    res.status(500).json({ message: 'Lỗi upload ảnh' });
  }
});

module.exports = router;