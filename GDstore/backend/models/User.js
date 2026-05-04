const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('user', 'admin', 'shipper'),
    defaultValue: 'user'
  },
  phone: {
    type: DataTypes.STRING
  },
  address: {
    type: DataTypes.TEXT
  },
  city: {
    type: DataTypes.STRING
  },
  province: {
    type: DataTypes.STRING
  },
  gender: {
    type: DataTypes.ENUM('Nam', 'Nữ', 'Khác'),
    defaultValue: 'Khác'
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  avatarUrl: {
    type: DataTypes.STRING
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  shipperRegistrationStatus: {
    type: DataTypes.ENUM('none', 'pending', 'rejected'),
    defaultValue: 'none'
  },
  shipperApplicationData: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Định nghĩa associations sau khi import các model khác
// (sẽ thêm sau khi tạo model Address và Bank)

module.exports = User;