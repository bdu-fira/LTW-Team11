const Review = require('../models/Review');
const User = require('../models/User');
const Product = require('../models/Product');

// Lấy danh sách đánh giá của 1 sản phẩm
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const reviews = await Review.findAndCountAll({
      where: { productId },
      include: [
        {
          model: User,
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      reviews: reviews.rows,
      total: reviews.count,
      page: parseInt(page),
      pages: Math.ceil(reviews.count / limit)
    });
  } catch (error) {
    console.error('Lấy danh sách đánh giá lỗi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Thêm đánh giá mới
exports.addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao' });
    }

    // Kiểm tra xem sản phẩm có tồn tại không
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }

    const review = await Review.create({
      productId,
      userId,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      message: 'Đánh giá thành công',
      review
    });
  } catch (error) {
    console.error('Thêm đánh giá lỗi:', error);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Cập nhật đánh giá (chỉ chủ sở hữu)
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa đánh giá này' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Đánh giá phải từ 1 đến 5 sao' });
    }

    await review.update({
      rating,
      comment
    });

    return res.json({
      success: true,
      message: 'Cập nhật đánh giá thành công',
      review
    });
  } catch (error) {
    console.error('Cập nhật đánh giá lỗi:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// Xóa đánh giá (admin hoặc chủ sở hữu)
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const review = await Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    if (!isAdmin && review.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa đánh giá này' });
    }

    await review.destroy();
    return res.json({ success: true, message: 'Xóa đánh giá thành công' });
  } catch (error) {
    console.error('Xóa đánh giá lỗi:', error);
    return res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};
