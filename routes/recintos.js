import express from "express";
import Recinto from "../models/recinto.js";

let router = express.Router();

// GET /recintos Obtiene todos los recintos almacenados
router.get("/", async (req, res) => {
    try
    {
        let resultado = await Recinto.find();
        if (resultado.length > 0)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(500).send({ ok: false, error: "No se han encontrado recintos" });
    } catch (error) { // Esta variable no la uso pero podría usarla para saber exactamente de donde viene el problema al mostrarlo con un console.log(error)
        res.status(500).send({ ok: false, error: "No se han encontrado recintos" });
    }
});

// GET /recintos/:id Obtiene el recinto con el id indicado
router.get("/:id", async (req, res) => {
    try
    {
        let resultado = await Recinto.findById(req.params.id);
        if (resultado)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: `Recinto ${req.params.id} no encontrado` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Recinto ${req.params.id} no encontrado` });
    }
});

// GET /recintos/localidad/:nombre Recintos de una localidad indicada
router.get("/localidad/:nombre", async (req, res) => {
    try
    {
        let resultado = await Recinto.find({ localidad: req.params.nombre });
        if (resultado.length > 0)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: "No se han encontrado recintos de la localidad indicada" });
    } catch (error) {
        res.status(404).send({ ok: false, error: "No se han encontrado recintos de la localidad indicada" });
    }
});

// POST /recintos Añade un nuevo recinto a la colección
router.post("/", async (req, res) => {
    try
    {
        let nuevoRecinto = new Recinto({
            nombre: req.body.nombre,
            direccion: req.body.direccion,
            localidad: req.body.localidad,
            aforoMaximo: req.body.aforoMaximo
        });
        let resultado = await nuevoRecinto.save();
        res.status(201).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(500).send({ ok: false, error: "Error añadiendo recinto" });
    }
});

// DELETE /recintos/:id Elimina el recinto con el id indicado
router.delete("/:id", async (req, res) => {
    try
    {
        let resultado = await Recinto.findByIdAndDelete(req.params.id);
        if (resultado)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: `Error eliminando recinto ${req.params.id}` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error eliminando recinto ${req.params.id}` });
    }
});

export default router;
