const router = require("express").Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register-doctor", authController.registerDoctor);
router.post("/register-patient", authController.registerPatient);
router.post("/login", authController.login);
router.post("/change-password", authMiddleware, authController.changePassword);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

module.exports = router;
