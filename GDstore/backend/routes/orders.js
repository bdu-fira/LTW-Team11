const express = require('express');
const router = express.Router();
const { protect, admin, adminOrShipper } = require('../middleware/auth');
const {
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
  cancelOrder,
  deleteOrder
} = require('../controllers/orderController');

// ✅ Routes cố định phải đặt TRƯỚC route động /:id

// Admin: lấy tất cả đơn hàng
router.get('/all', protect, admin, getAllOrders);

// Shipper: lấy danh sách đơn cần giao
router.get('/shipper', protect, adminOrShipper, getShipperOrders);

// Tạo đơn trực tiếp
router.post('/direct', protect, createDirectOrder);

// Routes cho user
router.route('/')
  .post(protect, createOrder)
  .get(protect, getMyOrders);

// Shipper: lấy tất cả đơn của tôi (theo shipperId)
router.get('/my-deliveries', protect, adminOrShipper, getMyDeliveries);

// Routes động /:id phải đặt CUỐI CÙNG
router.route('/:id')
  .get(protect, getOrderById);

router.put('/:id/cancel', protect, cancelOrder);

// Shipper: nhận đơn hàng (shipped → out_for_delivery)
router.post('/:id/claim', protect, adminOrShipper, claimOrder);

// Shipper: xác nhận đã giao + upload ảnh (out_for_delivery → delivery_confirmed)
router.post('/:id/confirm-delivery', protect, adminOrShipper, confirmDelivery);

// Admin: xác nhận đã giao (delivery_confirmed → delivered)
router.put('/:id/admin-confirm-delivered', protect, admin, adminConfirmDelivered);

// Admin: từ chối xác nhận → rollback về shipped
router.put('/:id/admin-reject-delivery', protect, admin, adminRejectDelivery);

// Admin: cập nhật trạng thái đơn hàng
router.put('/:id', protect, admin, updateOrderStatus);

// Admin: xóa đơn hàng
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;