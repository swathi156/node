const express = require("express");
const dotenv = require("dotenv");
dotenv.config(); 

const userDb = require("./config/userDb");
const patientDb = require("./config/patientDb");
const doctorDb = require("./config/doctorDb");

const patientRoutes = require("./routes/patientRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());

//API Routes
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

//Test all DB connections
Promise.all([
  userDb.authenticate(),
  patientDb.authenticate(),
  doctorDb.authenticate(),
])
  .then(() => {
    console.log("All databases connected successfully!");
    return Promise.all([
      userDb.sync({ alter: true }),
      patientDb.sync({ alter: true }),
      doctorDb.sync({ alter: true }),
    ]);
  })
  .then(() => {
    console.log("All tables synced successfully!");
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });
