const express = require("express");
const dotenv = require("dotenv");
const sequelize = require("./config/db");
const patientRoutes = require("./routes/patientRoutes");

dotenv.config();

const app = express();
app.use(express.json());

app.use("/api/patients", patientRoutes);

sequelize
  .authenticate()
  .then(() => {
    console.log("Database connected successfully.");
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("All models synchronized.");
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("Database connection failed:", err);
  });
