const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Đăng ký
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }
    
    const user = await User.create({ name, email, password, phone });
    req.session.userId = user.id;
    
    res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Đăng nhập
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email không tồn tại trong hệ thống',
        errorCode: 'USER_NOT_FOUND'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.'
      });
    }

    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không đúng',
        errorCode: 'WRONG_PASSWORD'
      });
    }
    
    req.session.userId = user.id;

    // Tick "Ghi nhớ đăng nhập" → gia hạn cookie 30 ngày
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
    }

    // Lọc bỏ password
    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({
      success: true,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

// Đăng nhập bằng Google
router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Thiếu Google credential' });
    }

    const { OAuth2Client } = require('google-auth-library');
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

    if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
      return res.status(500).json({ success: false, message: 'Google OAuth chưa được cấu hình' });
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID);

    // Verify token từ Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Tìm hoặc tạo user dựa vào email
    let user = await User.findOne({ where: { email } });
    if (!user) {
      // Tạo user mới từ Google
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        password: 'GOOGLE_' + Math.random().toString(36).slice(2),
        avatarUrl: picture || null,
      });
    } else if (!user.avatarUrl && picture) {
      // Cập nhật avatar nếu chưa có
      await user.update({ avatarUrl: picture }).catch(() => {});
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản của bạn đã bị vô hiệu hóa.'
      });
    }

    req.session.userId = user.id;

    const userResponse = user.toJSON();
    delete userResponse.password;

    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('Lỗi Google OAuth:', error.message);
    res.status(401).json({ success: false, message: 'Xác thực Google thất bại: ' + error.message });
  }
});

// Đăng xuất
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// Lấy thông tin user hiện tại
router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ success: false });
  }
  const user = await User.findByPk(req.session.userId, {
    attributes: { exclude: ['password'] }
  });
  
  if (user && user.isActive === false) {
    req.session.destroy();
    return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị vô hiệu hóa.' });
  }

  res.json({ success: true, user });
});

module.exports = router;