const router = require("express").Router();
const patientController = require("../controllers/patientController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware); 
router.get("/", patientController.getAllPatients);
router.get("/:id", patientController.getPatient);
router.put("/:id", patientController.updatePatient);
router.delete("/:id", patientController.deletePatient);

module.exports = router;
