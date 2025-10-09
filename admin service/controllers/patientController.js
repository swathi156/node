const Patient = require("../models/Patient");

// Get all patients
exports.getAllPatients = async (req, res) => {
    const patients = await Patient.findAll();
    res.json(patients);
};

// Get patient by ID
exports.getPatient = async (req, res) => {
    const patient = await Patient.findByPk(req.params.id);
    res.json(patient);
};

// Update patient
exports.updatePatient = async (req, res) => {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await patient.update(req.body);
    res.json({ message: "Patient updated", patient });
};

// Delete patient
exports.deletePatient = async (req, res) => {
    const patient = await Patient.findByPk(req.params.id);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    await patient.destroy();
    res.json({ message: "Patient deleted" });
};
