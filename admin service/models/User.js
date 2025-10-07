const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  reset_password_token: { type: DataTypes.STRING, allowNull: true },
  reset_token_expiry: { type: DataTypes.DATE, allowNull: true }
});

module.exports = User;
