const { DataTypes } = require("sequelize");
const sequelize = require("../config/db"); 

const Doctor = sequelize.define("Doctor", {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  specialization: { type: DataTypes.STRING, allowNull: false },
  hospital: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: "active" } 
});

module.exports = Doctor;
