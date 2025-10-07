const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to generate random password
function generatePassword(length) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

//  Register 
router.post("/register", async (req, res) => {
  try {
    const { email } = req.body;

    // Random password length between 8 and 15
    const passwordLength = Math.floor(Math.random() * (15 - 8 + 1)) + 8;
    const rawPassword = generatePassword(passwordLength);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const user = await User.create({ email, password: hashedPassword });

    // Send email with password
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Account Password",
      text: `Welcome! Your auto-generated password is: ${rawPassword}`,
    });

    res.json({ message: "User registered. Password sent to email." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login 
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password 
router.post("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Password validation: 8-15 chars, at least one uppercase, one lowercase, one number, one special char
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,15}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ 
        error: "Password must be 8-15 characters and include uppercase, lowercase, number, and special character"
      });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(400).json({ error: "Old password incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
