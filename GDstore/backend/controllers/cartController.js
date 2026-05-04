const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Lấy giỏ hàng của user
const getCart = async (req, res) => {
  try {
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'images', 'stock', 'isFlashSale', 'flashSaleDiscount', 'category']
      }]
    });
    
    res.json(cartItems);
  } catch (error) {
    console.error('Lỗi getCart:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Thêm sản phẩm vào giỏ hàng
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    // Kiểm tra sản phẩm tồn tại
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    
    // Kiểm tra số lượng tồn kho
    if (product.stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }
    
    // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
    const existingItem = await Cart.findOne({
      where: {
        userId: req.user.id,
        productId: productId
      }
    });
    
    if (existingItem) {
      // Cập nhật số lượng
      const newQuantity = existingItem.quantity + quantity;
      
      // Kiểm tra lại tồn kho
      if (product.stock < newQuantity) {
        return res.status(400).json({ message: 'Số lượng sản phẩm trong giỏ vượt quá tồn kho' });
      }
      
      existingItem.quantity = newQuantity;
      await existingItem.save();
    } else {
      // Thêm mới vào giỏ hàng
      await Cart.create({
        userId: req.user.id,
        productId: productId,
        quantity: quantity
      });
    }
    
    // Lấy giỏ hàng mới
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'images', 'stock', 'isFlashSale', 'flashSaleDiscount', 'category']
      }]
    });
    
    res.json({
      success: true,
      message: 'Đã thêm vào giỏ hàng',
      cart: cartItems
    });
  } catch (error) {
    console.error('Lỗi addToCart:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Cập nhật số lượng sản phẩm trong giỏ hàng
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const cartItem = await Cart.findOne({
      where: {
        id: req.params.itemId,
        userId: req.user.id
      },
      include: [Product]
    });
    
    if (!cartItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong giỏ' });
    }
    
    // Kiểm tra tồn kho
    if (cartItem.Product.stock < quantity) {
      return res.status(400).json({ message: 'Số lượng sản phẩm không đủ' });
    }
    
    if (quantity <= 0) {
      // Xóa nếu quantity <= 0
      await cartItem.destroy();
    } else {
      cartItem.quantity = quantity;
      await cartItem.save();
    }
    
    // Lấy giỏ hàng mới
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'images', 'stock', 'isFlashSale', 'flashSaleDiscount', 'category']
      }]
    });
    
    res.json(cartItems);
  } catch (error) {
    console.error('Lỗi updateCartItem:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa sản phẩm khỏi giỏ hàng
const removeFromCart = async (req, res) => {
  try {
    await Cart.destroy({
      where: {
        id: req.params.itemId,
        userId: req.user.id
      }
    });
    
    // Lấy giỏ hàng mới
    const cartItems = await Cart.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Product,
        attributes: ['id', 'name', 'price', 'images', 'stock', 'isFlashSale', 'flashSaleDiscount', 'category']
      }]
    });
    
    res.json(cartItems);
  } catch (error) {
    console.error('Lỗi removeFromCart:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// Xóa toàn bộ giỏ hàng
const clearCart = async (req, res) => {
  try {
    await Cart.destroy({
      where: { userId: req.user.id }
    });
    
    res.json({ message: 'Đã xóa giỏ hàng' });
  } catch (error) {
    console.error('Lỗi clearCart:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};