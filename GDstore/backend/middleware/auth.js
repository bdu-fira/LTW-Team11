const User = require('../models/User');

const protect = async (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }

  const user = await User.findByPk(req.session.userId);
  if (!user) {
    return res.status(401).json({ message: 'Người dùng không tồn tại' });
  }

  if (user.isActive === false) {
    return res.status(403).json({ message: 'Tài khoản của bạn đã bị vô hiệu hóa' });
  }

  req.user = user;
  next();
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Yêu cầu quyền admin' });
  }
};

const shipper = (req, res, next) => {
  if (req.user && req.user.role === 'shipper') {
    next();
  } else {
    res.status(403).json({ message: 'Yêu cầu quyền shipper' });
  }
};

// Cho phép cả admin lẫn shipper
const adminOrShipper = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'shipper')) {
    next();
  } else {
    res.status(403).json({ message: 'Yêu cầu quyền admin hoặc shipper' });
  }
};

module.exports = { protect, admin, shipper, adminOrShipper };