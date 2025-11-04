const express = require("express");
const router = express.Router();
const examController = require("../controllers/examController");
const authRequired = require("../middleware/authRequired");

//Ruta login
router.post("/login", examController.login);
//Ruta para mensaje de contacto
router.post("/contact", examController.recibirMensaje);
router.post("/logout", examController.salida); 

//Rutas protegidas
router.post("/start", authRequired, examController.startExamen);
router.post("/submit", authRequired, examController.submitExamen);
router.get("/pdf", authRequired, examController.generarPDF);

module.exports = router;
