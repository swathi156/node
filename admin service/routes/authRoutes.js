const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Setup transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth:
  {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try 
  {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.json({ message: "User registered successfully", user });
  } 
  catch (err) 
  {
    res.status(500).json({ error: err.message });
  }
});

// Login (JWT)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try 
  {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({ message: "Login successful", token });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password (Send OTP, valid 5 minutes)
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    user.reset_password_token = otp;
    user.reset_token_expiry = expiry;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`
    });

    res.json({ message: "OTP sent to your email (valid for 5 minutes)" });
  } catch (err) 
  {
    console.log("Error sending OTP:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.reset_password_token !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    if (new Date() > user.reset_token_expiry)
      return res.status(400).json({ error: "OTP expired" });

    res.json({ message: "OTP verified, you can reset password" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.reset_password_token !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    if (new Date() > user.reset_token_expiry)
      return res.status(400).json({ error: "OTP expired" });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.reset_password_token = null;
    user.reset_token_expiry = null;
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Protected Route
const verifyToken = require("../middleware/authMiddleware");
router.get("/dashboard", verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.email}! This is a protected route.` });
});

module.exports = router;
