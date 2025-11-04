const users = require("../data/users");

const authRequired = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ mensaje: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];
  const usuario = users.find((u) => u.token === token);

  if (!usuario) {
    return res.status(401).json({ mensaje: "Token no valido" });
  }

  req.userId = usuario.cuenta; 
  next();
};

module.exports = authRequired;
