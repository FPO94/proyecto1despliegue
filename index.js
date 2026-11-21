// Librerías 
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

//Enrutadores
import recintos from "./routes/recintos.js";
import eventos from "./routes/eventos.js";

// Conexión con la base de datos
mongoose.connect(process.env.MONGODB_URI);

// Habilitar el servidor Express 
let app = express();

// Habilitar el middleware para procesar peticiones JSON
app.use(express.json());

// Cargar los enrutadores
app.use("/recintos", recintos);
app.use("/eventos", eventos);

// Poner en marcha el servidor
app.listen(process.env.PORT || 3000);
