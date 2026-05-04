const Product = require('../models/Product');
const { Op } = require('sequelize');

// Lấy danh sách sản phẩm
const getProducts = async (req, res) => {
  try {
    console.log('========================================');
    console.log('📥 Đang lấy danh sách sản phẩm...');
    console.log('📥 Query params nhận được:', req.query);

    // ✅ FIX: Cho phép truyền limit từ ngoài vào (admin dùng limit lớn để lấy hết)
    const pageSize = req.query.limit ? Number(req.query.limit) : 12;
    const page = Number(req.query.page) || 1;

    const where = {};

    // Lọc theo từ khóa
    if (req.query.keyword && req.query.keyword !== '') {
      where.name = {
        [Op.like]: `%${req.query.keyword}%`
      };
      console.log('🔍 Lọc theo keyword:', req.query.keyword);
    }

    // Lọc theo category
    if (req.query.category && req.query.category !== '') {
      console.log('🔍 Đang lọc category:', req.query.category);
      where.category = req.query.category;
    } else {
      console.log('⚠️ Không có category filter');
    }

    // Lọc theo flash sale
    if (req.query.flashSale === 'true') {
      where.isFlashSale = true;
    }

    // Lọc theo giá
    if (req.query.minPrice && req.query.minPrice !== '') {
      where.price = {
        ...where.price,
        [Op.gte]: Number(req.query.minPrice)
      };
    }

    if (req.query.maxPrice && req.query.maxPrice !== '') {
      where.price = {
        ...where.price,
        [Op.lte]: Number(req.query.maxPrice)
      };
    }

    // Sắp xếp
    let order = [];
    switch (req.query.sortBy) {
      case 'price_asc':
        order = [['price', 'ASC']];
        break;
      case 'price_desc':
        order = [['price', 'DESC']];
        break;
      case 'name_asc':
        order = [['name', 'ASC']];
        break;
      case 'name_desc':
        order = [['name', 'DESC']];
        break;
      case 'newest':
      default:
        order = [['createdAt', 'DESC']];
        break;
    }

    console.log('📊 Where condition:', JSON.stringify(where, null, 2));

    const count = await Product.count({ where });
    console.log('📊 Tổng số sản phẩm thỏa mãn:', count);

    const products = await Product.findAll({
      where,
      order,
      limit: pageSize,
      offset: pageSize * (page - 1)
    });

    console.log('📊 Trả về', products.length, 'sản phẩm');
    console.log('========================================');

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count  // ✅ Luôn trả về tổng số thật sự
    });

  } catch (error) {
    console.error('❌ Lỗi getProducts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server: ' + error.message
    });
  }
};

// Lấy sản phẩm theo ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    console.error('Lỗi getProductById:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Thêm sản phẩm mới (admin)
const createProduct = async (req, res) => {
  try {
    console.log('🔄 Đang thêm sản phẩm mới...');
    const { isFlashSale, flashSaleDiscount, ...rest } = req.body;
    const productData = {
      ...rest,
      isFlashSale: isFlashSale || false,
      // Chỉ lưu discount nếu là flash sale
      flashSaleDiscount: (isFlashSale && flashSaleDiscount) ? parseInt(flashSaleDiscount) : 0,
    };
    const product = await Product.create(productData);
    console.log(`✅ Đã thêm sản phẩm: ${product.name}`);
    res.status(201).json(product);
  } catch (error) {
    console.error('Lỗi createProduct:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật sản phẩm (admin)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (product) {
      const { isFlashSale, flashSaleDiscount, ...rest } = req.body;
      const productData = {
        ...rest,
        isFlashSale: isFlashSale || false,
        // Chỉ lưu discount nếu là flash sale, nếu không thì reset về 0
        flashSaleDiscount: (isFlashSale && flashSaleDiscount) ? parseInt(flashSaleDiscount) : 0,
      };
      await product.update(productData);
      console.log(`✅ Đã cập nhật sản phẩm: ${product.name}`);
      res.json(product);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    console.error('Lỗi updateProduct:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa sản phẩm (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (product) {
      await product.destroy();
      console.log(`✅ Đã xóa sản phẩm: ${product.name}`);
      res.json({ message: 'Đã xóa sản phẩm' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    console.error('Lỗi deleteProduct:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};