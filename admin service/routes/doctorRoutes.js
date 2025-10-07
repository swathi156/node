const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");


function generatePassword(length = 8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});


function authenticateDoctor(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, doctor) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.doctor = doctor;
    next();
  });
}



router.post("/register", async (req, res) => {
  try {
    const { name, email, specialization, hospital, phone, status } = req.body;

    const existing = await Doctor.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: "Doctor already exists" });

    const plainPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const doctor = await Doctor.create({
      name, email, specialization, hospital, phone, password: hashedPassword, status: status || "active"
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Doctor Account Details",
      text: `Hello ${name},\nYour account has been created.\nEmail: ${email}\nPassword: ${plainPassword}`
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) return res.status(500).json({ message: "Doctor created but email not sent", doctor });
      res.status(201).json({ message: "Doctor registered and password sent via email", doctor });
    });

  } catch (error) {
    res.status(500).json({ message: "Error registering doctor", error: error.message });
  }
});


router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await Doctor.findOne({ where: { email } });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    const valid = await bcrypt.compare(password, doctor.password);
    if (!valid) return res.status(401).json({ message: "Incorrect password" });

    const token = jwt.sign({ email: doctor.email }, process.env.JWT_SECRET, { expiresIn: "2h" });
    res.json({ message: "Login successful", token });

  } catch (error) {
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});


router.get("/me", authenticateDoctor, async (req, res) => {
  const doctor = await Doctor.findOne({
    where: { email: req.doctor.email },
    attributes: { exclude: ["password"] }
  });
  res.json(doctor);
});


router.put("/update", authenticateDoctor, async (req, res) => {
  const { name, specialization, hospital, phone, status } = req.body;
  const doctor = await Doctor.findOne({ where: { email: req.doctor.email } });
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  await doctor.update({ name, specialization, hospital, phone, status });
  res.json({ message: "Doctor details updated", doctor });
});


router.delete("/delete", authenticateDoctor, async (req, res) => {
  const doctor = await Doctor.findOne({ where: { email: req.doctor.email } });
  if (!doctor) return res.status(404).json({ message: "Doctor not found" });

  await doctor.destroy();
  res.json({ message: "Doctor account deleted" });
});

router.get("/all", async (req, res) => {
  try {
    const doctors = await Doctor.findAll({
      attributes: { exclude: ["password"] } 
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching doctors", error: error.message });
  }
});

module.exports = router;
