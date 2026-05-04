const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');

// Lấy danh sách sản phẩm (có lọc)
router.get('/', getProducts);

// Lấy chi tiết sản phẩm
router.get('/:id', getProductById);

// Thêm sản phẩm (admin)
router.post('/', createProduct);

// Cập nhật sản phẩm (admin)
router.put('/:id', updateProduct);

// Xóa sản phẩm (admin)
router.delete('/:id', deleteProduct);

module.exports = router;