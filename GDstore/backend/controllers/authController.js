const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Tạo token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// Đăng ký tài khoản mới
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu' 
      });
    }

    const userExists = await User.findOne({ where: { email } });
    
    if (userExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Email đã được đăng ký' 
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || '',
      address: address || ''
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        token: generateToken(user.id)
      }
    });

  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau' 
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Vui lòng nhập email và mật khẩu' 
      });
    }

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

    // Lưu userId vào session
    req.session.userId = user.id;

    // Nếu tick "Ghi nhớ đăng nhập" → gia hạn session 30 ngày
    if (rememberMe) {
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 ngày
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        token: generateToken(user.id)
      }
    });

  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server, vui lòng thử lại sau' 
    });
  }
};

// Lấy thông tin user hiện tại
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Lỗi lấy thông tin user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Lỗi server' 
    });
  }
};

module.exports = { register, login, getMe };