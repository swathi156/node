const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Patient = sequelize.define("Patient", {
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    phno: { type: DataTypes.STRING },
    age: { type: DataTypes.INTEGER },
    gender: { type: DataTypes.STRING },
    height: { type: DataTypes.FLOAT },
    weight: { type: DataTypes.FLOAT },
    medicalCondition: { type: DataTypes.STRING },
    allergies: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING }
});

module.exports = Patient;
