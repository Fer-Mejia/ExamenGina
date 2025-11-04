const express = require("express");
const cors = require("cors");
const examRoutes = require("./routes/examRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());

const ALLOWED_ORIGINS = [
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://192.168.1.76:5500',
    'http://192.168.1.83:5500'
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    optionsSuccessStatus: 200
}));

//Rutas
app.use("/api", examRoutes);

//Servidor activo
app.listen(PORT, () => {
   console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
