const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shippingAddress: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  paymentMethod: {
    type: DataTypes.ENUM('cod', 'banking'),
    defaultValue: 'cod'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'out_for_delivery', 'delivery_confirmed', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT
  },
  // Shipper được gán cho đơn
  shipperId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  // Ảnh chứng minh giao hàng do shipper upload
  deliveryProofImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Ghi chú của shipper khi xác nhận giao
  deliveryNote: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'orders',
  timestamps: true
});

// Định nghĩa quan hệ
Order.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Order.belongsTo(User, { foreignKey: 'shipperId', as: 'Shipper' });

module.exports = Order;