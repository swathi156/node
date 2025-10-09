const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Doctor = sequelize.define("Doctor", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    specialization: { type: DataTypes.STRING },
    hospital: { type: DataTypes.STRING },
    phno: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING }
});

module.exports = Doctor;
