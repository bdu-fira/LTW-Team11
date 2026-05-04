const { Sequelize } = require('sequelize');

const sequelize = new Sequelize('homestore', 'root', '123456789', {
  host: '127.0.0.1',
  port: 3307,
  dialect: 'mysql',
  logging: false,
  charset: 'utf8mb4',
  dialectOptions: {
    charset: 'utf8mb4'
  }
});

module.exports = sequelize;