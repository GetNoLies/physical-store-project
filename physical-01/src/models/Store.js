const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Store = sequelize.define('Store', {
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  address: {
    type: DataTypes.JSON,
    allowNull: false
  }
});

module.exports = Store;