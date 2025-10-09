const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./config/db");

// Import routes
const authRoutes = require("./routes/authRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const patientRoutes = require("./routes/patientRoutes");

dotenv.config();
const app = express();
app.use(express.json());

// Root route
app.get("/", (req, res) => {
    res.send("Doctor & Patient Management Server is running");
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);

// Connect to DB
sequelize.authenticate()
    .then(() => console.log(" Database connected successfully"))
    .catch(err => console.error("Database connection error:", err));

// Sync DB (create tables if not exist)
sequelize.sync({ alter: true })
    .then(() => console.log("Database synced (tables created/updated)"))
    .catch(err => console.error("DB sync error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(` Server running on port ${PORT}`));
