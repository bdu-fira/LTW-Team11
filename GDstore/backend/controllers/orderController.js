const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User');
const sequelize = require('../config/database');
const { canTransitionStatus } = require('../utils/orderStatus');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Cấu hình multer cho ảnh chứng minh giao hàng
const deliveryProofDir = path.join(__dirname, '../uploads/delivery-proofs');
if (!fs.existsSync(deliveryProofDir)) {
  fs.mkdirSync(deliveryProofDir, { recursive: true });
}
const deliveryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, deliveryProofDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadDeliveryProof = multer({
  storage: deliveryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    ok ? cb(null, true) : cb(new Error('Chỉ chấp nhận file ảnh'));
  }
}).single('proofImage');

// Tạo đơn hàng mới
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { shippingAddress, phone, paymentMethod, notes } = req.body;
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [Product],
      transaction
    });
    if (cartItems.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }
    let totalAmount = 0;
    const orderItems = [];
    for (const item of cartItems) {
      const product = item.Product;
      const finalPrice = product.isFlashSale ? product.price * (1 - (product.flashSaleDiscount || 0) / 100) : product.price;
      totalAmount += finalPrice * item.quantity;
      orderItems.push({ productId: product.id, quantity: item.quantity, price: finalPrice, productName: product.name });
    }
    const order = await Order.create({ userId: req.user.id, totalAmount, shippingAddress, phone, paymentMethod, notes, status: 'pending' }, { transaction });
    for (const item of orderItems) {
      await OrderItem.create({ ...item, orderId: order.id }, { transaction });
    }
    await Cart.destroy({ where: { userId: req.user.id }, transaction });
    await transaction.commit();
    res.status(201).json({ success: true, message: 'Đặt hàng thành công!', order });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi tạo đơn hàng:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy đơn hàng của user hiện tại
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { userId: req.user.id },
      include: [{ model: OrderItem, include: [Product] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Lỗi getMyOrders:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Lấy đơn hàng theo ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: OrderItem, include: [Product] },
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'Shipper', attributes: ['id', 'name', 'email', 'phone'] }
      ]
    });
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (order.userId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'shipper') {
      return res.status(403).json({ message: 'Không có quyền xem đơn hàng này' });
    }
    res.json(order);
  } catch (error) {
    console.error('Lỗi getOrderById:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Admin: Lấy tất cả đơn hàng
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        { model: OrderItem, include: [Product] },
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'Shipper', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    return res.json(orders);
  } catch (error) {
    console.error('❌ Lỗi getAllOrders:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
  }
};

// ─── SHIPPER: Lấy danh sách đơn hàng của shipper ───
const getShipperOrders = async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const orders = await Order.findAll({
      where: { status: { [Op.in]: ['shipped', 'out_for_delivery', 'delivery_confirmed'] } },
      include: [
        { model: OrderItem, include: [Product] },
        { model: User, as: 'User',    attributes: ['id', 'name', 'email', 'phone'] },
        { model: User, as: 'Shipper', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Lỗi getShipperOrders:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// ─── SHIPPER: Lấy tất cả đơn của tôi (theo shipperId) ───
const getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { shipperId: req.user.id },
      include: [
        { model: OrderItem, include: [Product] },
        { model: User, as: 'User', attributes: ['id', 'name', 'email', 'phone'] }
      ],
      order: [['updatedAt', 'DESC']]
    });
    res.json(orders);
  } catch (error) {
    console.error('Lỗi getMyDeliveries:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// ─── SHIPPER: Nhận đơn hàng (claim) ───
const claimOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.status !== 'shipped') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Chỉ có thể nhận đơn hàng đang ở trạng thái "Shipped"' });
    }
    await order.update({
      status: 'out_for_delivery',
      shipperId: req.user.id
    }, { transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Đã nhận đơn! Hãy giao hàng và xác nhận khi giao xong.', order });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi claimOrder:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// ─── SHIPPER: Xác nhận đã giao + upload ảnh chứng minh ───
const confirmDelivery = async (req, res) => {
  uploadDeliveryProof(req, res, async (uploadErr) => {
    if (uploadErr) {
      return res.status(400).json({ message: 'Lỗi upload ảnh: ' + uploadErr.message });
    }
    const transaction = await sequelize.transaction();
    try {
      const order = await Order.findByPk(req.params.id, { transaction });
      if (!order) {
        await transaction.rollback();
        return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      }
      if (order.status !== 'out_for_delivery') {
        await transaction.rollback();
        return res.status(400).json({ message: 'Chỉ có thể xác nhận đơn đang ở trạng thái "Shipper đang giao"' });
      }
      // Chỉ shipper phụ trách mới được xác nhận (admin được miễn)
      if (req.user.role !== 'admin' && order.shipperId !== req.user.id) {
        await transaction.rollback();
        return res.status(403).json({ message: 'Bạn không phải shipper phụ trách đơn hàng này' });
      }
      if (!req.file) {
        await transaction.rollback();
        return res.status(400).json({ message: 'Vui lòng upload ảnh chứng minh giao hàng' });
      }
      const proofImageUrl = `/uploads/delivery-proofs/${req.file.filename}`;
      await order.update({
        status: 'delivery_confirmed',
        deliveryProofImage: proofImageUrl,
        deliveryNote: req.body.deliveryNote || '',
        shipperId: req.user.id
      }, { transaction });
      await transaction.commit();
      res.json({ success: true, message: 'Đã xác nhận giao hàng. Chờ admin xác nhận!', order });
    } catch (error) {
      await transaction.rollback();
      console.error('Lỗi confirmDelivery:', error);
      res.status(500).json({ message: 'Lỗi server: ' + error.message });
    }
  });
};

// ─── ADMIN: Xác nhận đơn hàng "đã giao" ───
const adminConfirmDelivered = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.status !== 'delivery_confirmed') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Đơn hàng chưa được shipper xác nhận giao' });
    }
    await order.update({ status: 'delivered' }, { transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Đã xác nhận đơn hàng giao thành công!', order });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi adminConfirmDelivered:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// ─── ADMIN: Từ chối xác nhận → rollback về "shipped" ───
const adminRejectDelivery = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.status !== 'delivery_confirmed') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Đơn hàng chưa ở trạng thái chờ xác nhận' });
    }
    if (order.deliveryProofImage) {
      const oldImagePath = path.join(__dirname, '..', order.deliveryProofImage);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }
    await order.update({ status: 'out_for_delivery', deliveryProofImage: null, deliveryNote: null }, { transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Đã từ chối. Đơn chuyển về "Shipper đang giao" để thử lại.', order });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi adminRejectDelivery:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Admin: Cập nhật trạng thái đơn hàng
const updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (!canTransitionStatus(order.status, status) && order.status !== status) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Chuyển đổi trạng thái không hợp lệ' });
    }
    const currentStatus = order.status;
    const newStatus = status;
    if (currentStatus !== newStatus) {
      if (currentStatus === 'pending' && ['processing', 'shipped', 'delivered'].includes(newStatus)) {
        const orderItems = await OrderItem.findAll({ where: { orderId: order.id }, transaction });
        for (const item of orderItems) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product) await product.update({ stock: product.stock - item.quantity }, { transaction });
        }
      } else if (['processing', 'shipped', 'delivered'].includes(currentStatus) && newStatus === 'cancelled') {
        const orderItems = await OrderItem.findAll({ where: { orderId: order.id }, transaction });
        for (const item of orderItems) {
          const product = await Product.findByPk(item.productId, { transaction });
          if (product) await product.update({ stock: product.stock + item.quantity }, { transaction });
        }
      }
    }
    order.status = status;
    await order.save({ transaction });
    await transaction.commit();
    res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công', order });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error('Lỗi updateOrderStatus:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Hủy đơn hàng (user)
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      await transaction.rollback();
      return res.status(403).json({ message: 'Không có quyền hủy đơn hàng này' });
    }
    if (order.status !== 'pending' && order.status !== 'processing') {
      await transaction.rollback();
      return res.status(400).json({ message: 'Không thể hủy đơn hàng đã vận chuyển hoặc đã giao' });
    }
    const oldStatus = order.status;
    order.status = 'cancelled';
    await order.save({ transaction });
    if (oldStatus !== 'pending') {
      const orderItems = await OrderItem.findAll({ where: { orderId: order.id }, transaction });
      for (const item of orderItems) {
        const product = await Product.findByPk(item.productId, { transaction });
        if (product) await product.update({ stock: product.stock + item.quantity }, { transaction });
      }
    }
    await transaction.commit();
    res.json({ success: true, message: 'Hủy đơn hàng thành công', order });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi cancelOrder:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

// Tạo đơn hàng trực tiếp từ 1 sản phẩm (Mua ngay)
const createDirectOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { productId, quantity, shippingAddress, phone, paymentMethod, notes } = req.body;
    const product = await Product.findByPk(productId, { transaction });
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    if (product.stock < quantity) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }
    const finalPrice = product.isFlashSale ? product.price * (1 - (product.flashSaleDiscount || 0) / 100) : product.price;
    const totalAmount = finalPrice * quantity;
    const order = await Order.create({ userId: req.user.id, totalAmount, shippingAddress, phone, paymentMethod, notes, status: 'pending' }, { transaction });
    await OrderItem.create({ orderId: order.id, productId: product.id, quantity, price: finalPrice, productName: product.name }, { transaction });
    await transaction.commit();
    res.status(201).json({ success: true, message: 'Đặt hàng thành công!', order });
  } catch (error) {
    await transaction.rollback();
    console.error('Lỗi createDirectOrder:', error);
    res.status(500).json({ message: 'Lỗi server: ' + error.message });
  }
};

module.exports = {
  createOrder,
  createDirectOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getShipperOrders,
  getMyDeliveries,
  claimOrder,
  confirmDelivery,
  adminConfirmDelivered,
  adminRejectDelivery,
  updateOrderStatus,
  cancelOrder
};