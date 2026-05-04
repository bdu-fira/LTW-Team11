const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Address = require('../models/Address');
const Bank = require('../models/Bank');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import controller functions
const {
  getUsers,
  toggleUserStatus,
  getProfile,
  updateProfile,
  changePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getBanks,
  addBank,
  updateBank,
  deleteBank,
  setDefaultBank,
  registerShipper,
  getShipperApplications,
  reviewShipperApplication
} = require('../controllers/userController');

// Middleware xác thực (giả sử bạn có middleware này)
const auth = (req, res, next) => {
  // Giả sử user được lưu từ session hoặc token
  // Cần có middleware này để set req.user
  if (req.session.userId) {
    req.user = { id: req.session.userId };
    next();
  } else {
    res.status(401).json({ message: 'Chưa đăng nhập' });
  }
};

// Cấu hình multer cho avatar
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    if (allowedTypes.test(file.mimetype) && allowedTypes.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp)'));
    }
  }
});

// ========== USER ROUTES ==========

// Lấy danh sách người dùng (admin)
router.get('/', getUsers);

// Kích hoạt / vô hiệu hóa người dùng (admin)
router.put('/:id/status', auth, toggleUserStatus);

// Lấy profile hiện tại
router.get('/profile', auth, getProfile);

// Cập nhật profile
router.put('/profile', auth, updateProfile);

// Đổi mật khẩu
router.put('/password', auth, changePassword);

// Upload avatar
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file' });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });

    // Xóa avatar cũ
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '..', user.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const newAvatarUrl = `/uploads/${req.file.filename}`;
    await user.update({ avatarUrl: newAvatarUrl });

    res.json({ success: true, avatarUrl: newAvatarUrl, message: 'Cập nhật ảnh thành công' });
  } catch (error) {
    if (error instanceof multer.MulterError) {
      return res.status(400).json({ message: 'Lỗi file: ' + error.message });
    }
    res.status(500).json({ message: error.message || 'Lỗi xử lý ảnh' });
  }
});

// ========== ADDRESS ROUTES ==========
router.get('/addresses', auth, getAddresses);
router.post('/addresses', auth, addAddress);
router.put('/addresses/:id', auth, updateAddress);
router.delete('/addresses/:id', auth, deleteAddress);
router.put('/addresses/:id/default', auth, setDefaultAddress);

// ========== BANK ROUTES ==========
router.get('/banks', auth, getBanks);
router.post('/banks', auth, addBank);
router.put('/banks/:id', auth, updateBank);
router.delete('/banks/:id', auth, deleteBank);
router.put('/banks/:id/default', auth, setDefaultBank);

// ========== SHIPPER REGISTRATION ROUTES ==========
router.post('/register-shipper', auth, registerShipper);
router.get('/shipper-applications', auth, getShipperApplications);
router.put('/shipper-applications/:id', auth, reviewShipperApplication);

module.exports = router;