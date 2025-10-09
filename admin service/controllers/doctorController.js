const Doctor = require("../models/Doctor");

// Get all doctors
exports.getAllDoctors = async (req, res) => {
    const doctors = await Doctor.findAll();
    res.json(doctors);
};

// Get doctor by ID
exports.getDoctor = async (req, res) => {
    const doctor = await Doctor.findByPk(req.params.id);
    res.json(doctor);
};

// Update doctor
exports.updateDoctor = async (req, res) => {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    await doctor.update(req.body);
    res.json({ message: "Doctor updated", doctor });
};

// Delete doctor
exports.deleteDoctor = async (req, res) => {
    const doctor = await Doctor.findByPk(req.params.id);
    if (!doctor) return res.status(404).json({ error: "Doctor not found" });

    await doctor.destroy();
    res.json({ message: "Doctor deleted" });
};
