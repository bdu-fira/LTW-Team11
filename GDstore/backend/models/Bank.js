const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Bank = sequelize.define('Bank', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        }
    },
    bankName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    accountNumber: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    accountName: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'banks',
    timestamps: true
});

module.exports = Bank;