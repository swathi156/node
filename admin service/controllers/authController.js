const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const transporter = require("../config/mail");
require("dotenv").config();

const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// Register Doctor
exports.registerDoctor = async (req, res) => {
    try {
        const { name, email, specialization, hospital, phno, status } = req.body;
        const password = generatePassword();
        const hashed = await bcrypt.hash(password, 10);

        const doctor = await Doctor.create({ name, email, specialization, hospital, phno, status, password: hashed });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Doctor Registration Password",
            text: `Your password is: ${password}`
        });

        res.json({ message: "Doctor registered and password sent to email" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Register Patient
exports.registerPatient = async (req, res) => {
    try {
        const { name, email, phno, age, gender, height, weight, medicalCondition, allergies } = req.body;
        const password = generatePassword();
        const hashed = await bcrypt.hash(password, 10);

        const patient = await Patient.create({ name, email, phno, age, gender, height, weight, medicalCondition, allergies, password: hashed });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Patient Registration Password",
            text: `Your password is: ${password}`
        });

        res.json({ message: "Patient registered and password sent to email" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Login (Doctor or Patient)
exports.login = async (req, res) => {
    try {
        const { email, password, type } = req.body; // type = doctor/patient
        let user;

        if (type === "doctor") user = await Doctor.findOne({ where: { email } });
        else if (type === "patient") user = await Patient.findOne({ where: { email } });

        if (!user) return res.status(400).json({ error: "User not found" });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ error: "Wrong password" });

        const token = jwt.sign({ id: user.id, type }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Change Password
exports.changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const { id, type } = req.user;
        const user = type === "doctor" ? await Doctor.findByPk(id) : await Patient.findByPk(id);

        const match = await bcrypt.compare(oldPassword, user.password);
        if (!match) return res.status(400).json({ error: "Old password incorrect" });

        const hashed = await bcrypt.hash(newPassword, 10);
        user.password = hashed;
        await user.save();

        res.json({ message: "Password changed successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Forgot Password (OTP)
const otpStore = {}; // In-memory store for OTP

exports.forgotPassword = async (req, res) => {
    try {
        const { email, type } = req.body;
        let user;
        if (type === "doctor") user = await Doctor.findOne({ where: { email } });
        else if (type === "patient") user = await Patient.findOne({ where: { email } });

        if (!user) return res.status(400).json({ error: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = { otp, expires: Date.now() + 6 * 60 * 1000 }; // 6 mins

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "OTP for Password Reset",
            text: `Your OTP is: ${otp}`
        });

        res.json({ message: "OTP sent to email, valid for 6 mins" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Reset Password using OTP
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword, type } = req.body;

        if (!otpStore[email] || otpStore[email].expires < Date.now())
            return res.status(400).json({ error: "OTP expired or invalid" });

        if (otpStore[email].otp != otp) return res.status(400).json({ error: "Incorrect OTP" });

        let user = type === "doctor" ? await Doctor.findOne({ where: { email } }) : await Patient.findOne({ where: { email } });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        delete otpStore[email];
        res.json({ message: "Password reset successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
