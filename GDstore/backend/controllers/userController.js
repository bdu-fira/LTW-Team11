const User = require('../models/User');
const Address = require('../models/Address');
const Bank = require('../models/Bank');

// Lấy tất cả người dùng (chỉ admin)
const getUsers = async (req, res) => {
  try {
    console.log('🔄 Đang lấy danh sách users...');

    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Tìm thấy ${users.length} người dùng`);
    res.json(users);

  } catch (error) {
    console.error('❌ Lỗi getUsers:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Kích hoạt / Vô hiệu hóa người dùng (chỉ admin)
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ngăn admin tự vô hiệu hóa chính mình (nếu cần xử lý thêm an toàn)
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'Không thể tự vô hiệu hóa tài khoản của chính mình' });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Ngăn admin khóa tài khoản của một admin khác
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Không được phép khóa tài khoản Admin khác!' });
    }

    // Đảo ngược trạng thái isActive
    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: user.isActive ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản',
      user: { id: user.id, isActive: user.isActive }
    });
  } catch (error) {
    console.error('Lỗi toggleUserStatus:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Lấy thông tin user hiện tại
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.json(user);

  } catch (error) {
    console.error('Lỗi getProfile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật thông tin user
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    const { name, phone, address, city, province, gender, dateOfBirth } = req.body;

    user.name = name || user.name;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.city = city || user.city;
    user.province = province || user.province;
    user.gender = gender || user.gender;
    user.dateOfBirth = dateOfBirth || user.dateOfBirth;

    await user.save();

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      address: user.address,
      city: user.city,
      province: user.province,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth
    });

  } catch (error) {
    console.error('Lỗi updateProfile:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // Kiểm tra mật khẩu hiện tại
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
    }

    // Cập nhật mật khẩu mới
    user.password = newPassword;
    await user.save();

    res.json({ message: 'Đổi mật khẩu thành công' });

  } catch (error) {
    console.error('Lỗi changePassword:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ========== QUẢN LÝ ĐỊA CHỈ ==========

// Lấy danh sách địa chỉ của user
const getAddresses = async (req, res) => {
  try {
    const addresses = await Address.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(addresses);
  } catch (error) {
    console.error('Lỗi getAddresses:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Thêm địa chỉ mới
const addAddress = async (req, res) => {
  try {
    const { fullName, phone, address, city, district, ward, isDefault } = req.body;

    // Nếu địa chỉ mới là mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const newAddress = await Address.create({
      userId: req.user.id,
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      isDefault: isDefault || false
    });

    res.status(201).json(newAddress);
  } catch (error) {
    console.error('Lỗi addAddress:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật địa chỉ
const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, city, district, ward, isDefault } = req.body;

    const addressItem = await Address.findOne({
      where: { id, userId: req.user.id }
    });

    if (!addressItem) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    // Nếu cập nhật thành mặc định, bỏ mặc định các địa chỉ khác
    if (isDefault && !addressItem.isDefault) {
      await Address.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    await addressItem.update({
      fullName,
      phone,
      address,
      city,
      district,
      ward,
      isDefault: isDefault || false
    });

    res.json(addressItem);
  } catch (error) {
    console.error('Lỗi updateAddress:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa địa chỉ
const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const addressItem = await Address.findOne({
      where: { id, userId: req.user.id }
    });

    if (!addressItem) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    await addressItem.destroy();
    res.json({ message: 'Xóa địa chỉ thành công' });
  } catch (error) {
    console.error('Lỗi deleteAddress:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đặt địa chỉ mặc định
const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;

    const addressItem = await Address.findOne({
      where: { id, userId: req.user.id }
    });

    if (!addressItem) {
      return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });
    }

    // Bỏ mặc định tất cả địa chỉ khác
    await Address.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );

    // Đặt địa chỉ này làm mặc định
    await addressItem.update({ isDefault: true });

    res.json({ message: 'Đặt địa chỉ mặc định thành công' });
  } catch (error) {
    console.error('Lỗi setDefaultAddress:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ========== QUẢN LÝ NGÂN HÀNG ==========

// Lấy danh sách ngân hàng của user
const getBanks = async (req, res) => {
  try {
    const banks = await Bank.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(banks);
  } catch (error) {
    console.error('Lỗi getBanks:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Thêm tài khoản ngân hàng mới
const addBank = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, isDefault } = req.body;

    // Nếu tài khoản mới là mặc định, bỏ mặc định các tài khoản khác
    if (isDefault) {
      await Bank.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    const newBank = await Bank.create({
      userId: req.user.id,
      bankName,
      accountNumber,
      accountName,
      isDefault: isDefault || false
    });

    res.status(201).json(newBank);
  } catch (error) {
    console.error('Lỗi addBank:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật tài khoản ngân hàng
const updateBank = async (req, res) => {
  try {
    const { id } = req.params;
    const { bankName, accountNumber, accountName, isDefault } = req.body;

    const bankItem = await Bank.findOne({
      where: { id, userId: req.user.id }
    });

    if (!bankItem) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản ngân hàng' });
    }

    // Nếu cập nhật thành mặc định, bỏ mặc định các tài khoản khác
    if (isDefault && !bankItem.isDefault) {
      await Bank.update(
        { isDefault: false },
        { where: { userId: req.user.id } }
      );
    }

    await bankItem.update({
      bankName,
      accountNumber,
      accountName,
      isDefault: isDefault || false
    });

    res.json(bankItem);
  } catch (error) {
    console.error('Lỗi updateBank:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa tài khoản ngân hàng
const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;

    const bankItem = await Bank.findOne({
      where: { id, userId: req.user.id }
    });

    if (!bankItem) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản ngân hàng' });
    }

    await bankItem.destroy();
    res.json({ message: 'Xóa tài khoản ngân hàng thành công' });
  } catch (error) {
    console.error('Lỗi deleteBank:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Đặt tài khoản ngân hàng mặc định
const setDefaultBank = async (req, res) => {
  try {
    const { id } = req.params;

    const bankItem = await Bank.findOne({
      where: { id, userId: req.user.id }
    });

    if (!bankItem) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản ngân hàng' });
    }

    // Bỏ mặc định tất cả tài khoản khác
    await Bank.update(
      { isDefault: false },
      { where: { userId: req.user.id } }
    );

    // Đặt tài khoản này làm mặc định
    await bankItem.update({ isDefault: true });

    res.json({ message: 'Đặt tài khoản mặc định thành công' });
  } catch (error) {
    console.error('Lỗi setDefaultBank:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ========== ĐĂNG KÝ SHIPPER ==========

const registerShipper = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    if (user.role === 'shipper' || user.role === 'admin') {
      return res.status(400).json({ message: 'Tài khoản này đã là Shipper hoặc Admin' });
    }

    if (user.shipperRegistrationStatus === 'pending') {
      return res.status(400).json({ message: 'Bạn đã gửi yêu cầu và đang chờ duyệt' });
    }

    // Dữ liệu từ form đăng ký (ví dụ: cccd, vehicleType, licensePlate, area)
    const applicationData = req.body;
    
    // Lưu dưới dạng JSON string trong field TEXT
    user.shipperApplicationData = JSON.stringify(applicationData);
    user.shipperRegistrationStatus = 'pending';
    
    await user.save();

    res.json({ message: 'Gửi yêu cầu đăng ký Shipper thành công', user });
  } catch (error) {
    console.error('Lỗi registerShipper:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getShipperApplications = async (req, res) => {
  try {
    // Chỉ admin mới gọi được (đã phân quyền ở route nếu có)
    const applications = await User.findAll({
      where: { shipperRegistrationStatus: 'pending' },
      attributes: ['id', 'name', 'email', 'phone', 'shipperApplicationData', 'createdAt']
    });
    
    // Parse lại JSON trước khi gửi về client
    const results = applications.map(app => {
      let data = {};
      try {
        data = app.shipperApplicationData ? JSON.parse(app.shipperApplicationData) : {};
      } catch (e) {
        console.error('Lỗi parse json', e);
      }
      return {
        id: app.id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        applicationData: data,
        createdAt: app.createdAt
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Lỗi getShipperApplications:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const reviewShipperApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' hoặc 'reject'

    const user = await User.findByPk(id);
    if (!user || user.shipperRegistrationStatus !== 'pending') {
      return res.status(404).json({ message: 'Không tìm thấy yêu cầu đăng ký hợp lệ' });
    }

    if (action === 'approve') {
      user.role = 'shipper';
      user.shipperRegistrationStatus = 'none';
      // Có thể giữ lại hoặc xóa shipperApplicationData tùy business logic. Ở đây mình giữ lại.
    } else if (action === 'reject') {
      user.shipperRegistrationStatus = 'rejected';
    } else {
      return res.status(400).json({ message: 'Hành động không hợp lệ' });
    }

    await user.save();
    res.json({ message: `Đã ${action === 'approve' ? 'duyệt' : 'từ chối'} yêu cầu của ${user.name}` });
  } catch (error) {
    console.error('Lỗi reviewShipperApplication:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getUsers,
  toggleUserStatus,
  getProfile,
  updateProfile,
  changePassword,
  // Address
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  // Bank
  getBanks,
  addBank,
  updateBank,
  deleteBank,
  setDefaultBank,
  // Shipper Registration
  registerShipper,
  getShipperApplications,
  reviewShipperApplication
};