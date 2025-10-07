const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Patient = require("../models/patient");

// Generate random password
function generatePassword(length = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password
  },
});

// Send email with 6-minute timeout
async function sendEmailWithTimeout(mailOptions, timeout = 360000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Email sending timed out after 6 minutes"));
    }, timeout);

    transporter.sendMail(mailOptions, (err, info) => {
      clearTimeout(timer);
      if (err) reject(err);
      else resolve(info);
    });
  });
}

// ======================== ROUTES ======================== //

// Register patient
router.post("/register", async (req, res) => {
  try {
    const { name, email, phno, height, weight, age, gender, medical_condition, allergies } = req.body;

    if (!name || !email || !phno) {
      return res.status(400).json({ error: "Name, email, and phone are required" });
    }

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ where: { email } });
    if (existingPatient) return res.status(400).json({ error: "Patient already exists" });

    // Generate password
    const plainPassword = generatePassword(10);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const patient = await Patient.create({
      name, email, phno, height, weight, age, gender, medical_condition, allergies, password: hashedPassword
    });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Patient Account Password",
      text: `Hello ${name},\nYour password: ${plainPassword}\nPlease keep it safe.`,
    };

    await sendEmailWithTimeout(mailOptions, 360000); // 6 minutes

    res.json({ message: "Patient registered successfully. Password sent to email." });
  } catch (error) {
    console.error("Registration error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Login patient
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const patient = await Patient.findOne({ where: { email } });

    if (!patient) return res.status(400).json({ error: "Invalid email" });

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid password" });

    const token = jwt.sign({ id: patient.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token });
  } catch (error) {
    res.status(500).json({ error: "Server error during login" });
  }
});

//  Get all patients
router.get("/", async (req, res) => {
  try {
    const patients = await Patient.findAll();
    res.json(patients);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching patients" });
  }
});

// Get one patient by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ error: "Server error fetching patient" });
  }
});

// Update patient
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await patient.update(req.body);
    res.json({ message: "Patient updated successfully", data: patient });
  } catch (error) {
    res.status(500).json({ error: "Server error updating patient" });
  }
});

// Delete patient
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findByPk(id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await patient.destroy();
    res.json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error deleting patient" });
  }
});

module.exports = router;

