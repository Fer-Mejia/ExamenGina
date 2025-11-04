const crypto = require("crypto");
const PDFDocument = require("pdfkit");
const path = require("path");
const users = require("../data/users");
const questions = require("../data/questions");
const mensajes = require("../data/contactMessages");

//generamos el token
const login = (req, res) => {
  const { cuenta, password } = req.body;
  const usuario = users.find((u) => u.cuenta === cuenta && u.password === password);

  if (!usuario) {
    return res.status(401).json({ mensaje: "Credenciales incorrectas" });
  }

  const token = crypto.randomUUID();
  usuario.token = token;

  console.log("Usuario logueado:", usuario.nombreCompleto);
  console.log("Token generado:", token);

  res.json({ token, nombre: usuario.nombreCompleto });
};

//generamos las preguntas de forma aleatoria
const startExamen = (req, res) => {
  const user = users.find((u) => u.cuenta === req.userId);

  if (!user) {
    return res.status(401).json({ mensaje: "Usuario no encontrado" });
  }

  if (user.intentoExamen) {
    return res.status(403).json({ mensaje: "El examen solo se puede aplicar una vez" });
  }

  const preguntasAleatorias = [...questions]
    .sort(() => Math.random() - 0.5)
    .slice(0, 8)
    .map((q, index) => {
      const opcionesBarajadas = [...q.opciones].sort(() => Math.random() - 0.5);
      return {
        numero: index + 1,
        pregunta: q.pregunta,
        opciones: opcionesBarajadas
      };
    });

  user.intentoExamen = preguntasAleatorias;

  console.log("Examen generado para:", user.nombreCompleto);
  res.json({ examen: preguntasAleatorias });
};

//califica y guarda según las respuestas
const submitExamen = (req, res) => {
  const user = users.find((u) => u.cuenta === req.userId);

  if (!user || !user.intentoExamen) {
    return res.status(400).json({ mensaje: "No hay intento registrado para este usuario" });
  }

  const respuestasUsuario = req.body.respuestas;
  const preguntasIntento = user.intentoExamen;

  if (!Array.isArray(respuestasUsuario) || respuestasUsuario.length !== preguntasIntento.length) {
    return res.status(400).json({ mensaje: "Número de respuestas inválido" });
  }

  let correctas = 0;

  preguntasIntento.forEach((pregunta, index) => {
    const original = questions.find((q) => q.pregunta === pregunta.pregunta);
    if (original && respuestasUsuario[index] === original.respuestaCorrecta) {
      correctas++;
    }
  });

  const calificacion = (correctas / preguntasIntento.length) * 100;
  const aprobado = calificacion >= 70;

  user.calificacion = calificacion;
  user.aprobado = aprobado;

  console.log("Usuario:", user.nombreCompleto);
  console.log("Calificación:", calificacion);
  console.log("¿Aprobó?:", aprobado);

  res.json({
    mensaje: aprobado ? "¡Examen aprobado!" : "Examen no aprobado",
    calificacion,
    aprobado
  });
};

//Generar PDF
const generarPDF = (req, res) => {
  const user = users.find((u) => u.cuenta === req.userId);

  if (!user || !user.intentoExamen || !user.aprobado) {
    return res.status(403).json({ mensaje: "No autorizado para generar certificado" });
  }

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const chunks = [];

  doc.on("data", (chunk) => chunks.push(chunk));
  doc.on("end", () => {
    const pdfBuffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=certificado.pdf");
    res.send(pdfBuffer);
  });

  const fecha = new Date().toLocaleDateString("es-MX");
  const ciudad = "Aguascalientes";
  const empresa = "progCert";
  const certificacion = "Certificación en Java";
  const instructor = "Georgina Salazar";
  const ceo = "Miguel Zavala";
  const logo = path.join(__dirname, "../pdf/logo.jpg");
  const firma1 = path.join(__dirname, "../pdf/FirmaInst.jpg");
  const firma2 = path.join(__dirname, "../pdf/FirmaCEO.jpg");

  //Encabezado
  doc.rect(0, 0, doc.page.width, 100).fill("#071753");
  doc.image(logo, doc.page.width / 2 - 40, 20, { width: 100 });
  doc.fillColor("white").fontSize(22).font("Helvetica-Bold").text("CERTIFICADO DE COMPETENCIA", 0, 110, {
  align: "center"
  });

  //Detalles del certificado
  doc.moveDown();
  doc.fontSize(22).fillColor("#000").font("Helvetica-Bold").text("Felicidades a:", { align: "center" });
  doc.fontSize(24).fillColor("#071753").font("Helvetica-Bold").text(user.nombreCompleto, { align: "center" });

  doc.moveDown();
  doc.fontSize(14).font("Helvetica").fillColor("#000").text(`Por haber aprobado el examen de:`, { align: "center" });
  doc.fontSize(16).fillColor("#071753").text(certificacion, { align: "center" });

  doc.moveDown();
  doc.fontSize(12).fillColor("#000").text(`Fecha del examen: ${fecha}`, { align: "center" });
  doc.text(`Ciudad: ${ciudad}`, { align: "center" });
  doc.text(`Empresa: ${empresa}`, { align: "center" });

  doc.moveDown();
  const calificacion = user.calificacion !== undefined ? user.calificacion.toFixed(2) : "N/A";
  doc.fontSize(16).fillColor("#4754a1").font("Helvetica-Bold").text(`Calificación obtenida: ${calificacion}%`, {
    align: "center"
  });

  //Línea divisoria
  doc.moveDown().moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();

  doc.moveDown();
  const firmaY = doc.y + 20;

  //Firma instructor
  doc.image(firma1, 100, firmaY, { width: 80 });
  doc.y = firmaY + 65;
  doc.fontSize(12).fillColor("#4754a1").text(instructor, 100, doc.y, {
    width: 150,
    align: "center"
  });
  doc.fontSize(10).fillColor("#000").text("Instructora", 100, doc.y + 15, {
    width: 150,
    align: "center"
  });

  //Firma CEO
  doc.image(firma2, 350, firmaY, { width: 80 });
  doc.y = firmaY + 65;
  doc.fontSize(12).fillColor("#4754a1").text(ceo, 350, doc.y, {
    width: 150,
    align: "center"
  });
  doc.fontSize(10).fillColor("#000").text("CEO progCert", 350, doc.y + 15, {
    width: 150,
    align: "center"
  });

  doc.end();
};


//Mensaje de los contactos
const recibirMensaje = (req, res) => {
  const { nombre, correo, mensaje } = req.body;

  if (!nombre || !correo || !mensaje) {
    return res.status(400).json({ mensaje: "Es necesario llenar todos los campos" });
  }

  const nuevoMensaje = {
    nombre,
    correo,
    mensaje,
    fecha: new Date().toLocaleDateString("es-MX")
  };

  mensajes.push(nuevoMensaje);

  console.log("Nuevo mensaje recibido:", nuevoMensaje);
  console.log("Todos los mensajes recibidos hasta ahora:");
  console.log(mensajes); 

  res.json({ mensaje: "Mensaje recibido correctamente" });
};


const cierresSesion = [];

const salida = (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ mensaje: "Nombre no proporcionado" });
  }

  const eventoSalida = {
    nombre,
    fecha: new Date().toLocaleDateString("es-MX"),
    hora: new Date().toLocaleTimeString("es-MX")
  };

  cierresSesion.push(eventoSalida);

  // Mostrar en consola para evidencia
  console.log("Cierre de sesión registrado:", eventoSalida);
  console.log("Historial de cierres de sesión:");
  console.log(cierresSesion);

  res.json({ mensaje: "Cierre de sesión registrado correctamente" });
};



//funciones
module.exports = {
  login,
  startExamen,
  submitExamen,
  generarPDF,
  salida,
  recibirMensaje
};
