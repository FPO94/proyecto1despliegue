import mongoose from "mongoose";

let entradaSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        minlength: 3
    },
    precio: {
        type: Number,
        required: true,
        min: 0
    },
    disponibles: {
        type: Number,
        required: true,
        min: 0,
        validate: Number.isInteger        
    }
});

let eventoSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        minlength: 5
    },
    fecha: {
        type: Date,
        required: true
    },
    entradas: [entradaSchema],
    recinto: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: "recintos",
        required: true
    }
});



let Evento = mongoose.model("eventos", eventoSchema);

export default Evento;
