import express from "express";
import Evento from "../models/evento.js";
import Recinto from "../models/recinto.js";

let router = express.Router();

// GET /eventos Obtiene el listado de todos los eventos
router.get("/", async (req, res) => {
    try
    {
        let resultado = await Evento.find().populate("recinto");
        if (resultado.length > 0)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(500).send({ ok: false, error: "No se han encontrado eventos" });
    } catch (error) {
        res.status(500).send({ ok: false, error: "No se han encontrado eventos" });
    }
});

// GET /eventos/:id Obtiene el evento con el id indicado
router.get("/:id", async (req, res) => {
    try
    {
        let resultado = await Evento.findById(req.params.id);
        if (resultado)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: `Evento ${req.params.id} no encontrado` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Evento ${req.params.id} no encontrado` });
    }
});

// GET /eventos/localidad/:nombre Obtiene eventos de la localidad indicada y cuya fecha aún no haya pasado
router.get("/localidad/:nombre", async (req, res) => {
    try
    {
        let recintos = await Recinto.find({ localidad: req.params.nombre });
        let ids = recintos.map(r => r._id); // Para quedarnos solo con los ids
        let resultado = await Evento.find({ recinto: { $in: ids }, fecha: { $gte: new Date() } });
        if (resultado.length > 0)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: "No se han encontrado eventos" });
    } catch (error) {
        res.status(404).send({ ok: false, error: "No se han encontrado eventos" });
    }
});

// POST /eventos Añade un nuevo evento
router.post("/", async (req, res) => {
    try
    {
        let nuevoEvento = new Evento({
            nombre: req.body.nombre,
            fecha: req.body.fecha,
            entradas: req.body.entradas,
            recinto: req.body.recinto
        });
        let resultado = await nuevoEvento.save();
        res.status(201).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(500).send({ ok: false, error: "Error añadiendo evento" });
    }
});

// PUT /eventos/:id Actualiza los datos del evento con el id indicado
router.put("/:id", async (req, res) => {
    try
    {
        // Si algún campo no viene en el body llega como undefined, y Mongoose lo ignora (el campo se queda como estaba)
        let resultado = await Evento.findByIdAndUpdate(req.params.id, {
            $set: {
                nombre: req.body.nombre,
                fecha: req.body.fecha,
                entradas: req.body.entradas,
                recinto: req.body.recinto
            }
        }, { returnDocument: "after", runValidators: true });
        if (resultado)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: `Error actualizando evento ${req.params.id}` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error actualizando evento ${req.params.id}` });
    }
});

// DELETE /eventos/:id Elimina el evento con el id indicado
router.delete("/:id", async (req, res) => {
    try
    {
        let resultado = await Evento.findByIdAndDelete(req.params.id);
        if (resultado)
            res.status(200).send({ ok: true, resultado: resultado });
        else
            res.status(404).send({ ok: false, error: `Error eliminando evento ${req.params.id}` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error eliminando evento ${req.params.id}` });
    }
});

// GET /eventos/entradas/:idEvento/:tipoEntrada Obtiene el precio y el número de entradas disponibles del evento indicado
router.get("/entradas/:idEvento/:tipoEntrada", async (req, res) => {
    try
    {
        let evento = await Evento.findById(req.params.idEvento);
        // Si no existe el evento, entrada vale null y vamos al else (404). Sin esto, acceder a evento.entradas con evento null lanzaría un error y saltaría al catch
        let entrada = evento ? evento.entradas.find(e => e.tipo === req.params.tipoEntrada) : null;
        if (entrada)
            res.status(200).send({ ok: true, resultado: { precio: entrada.precio, disponibles: entrada.disponibles } });
        else
            res.status(404).send({ ok: false, error: `Error obteniendo datos de entrada para evento ${req.params.idEvento}` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error obteniendo datos de entrada para evento ${req.params.idEvento}` });
    }
});

// PUT /eventos/entradas/:idEvento/:tipoEntrada/:cantidad Resta la cantidad de entradas de las disponibles para el evento y tipo de entrada indicados
router.put("/entradas/:idEvento/:tipoEntrada/:cantidad", async (req, res) => {
    try
    {
        let cantidad = Number(req.params.cantidad);
        let evento = await Evento.findById(req.params.idEvento);
        // Si no existe el evento, entrada vale null y vamos al else (404). Sin esto, acceder a evento.entradas con evento null lanzaría un error y saltaría al catch
        let entrada = evento ? evento.entradas.find(e => e.tipo === req.params.tipoEntrada) : null;
        if (entrada && cantidad > 0 && entrada.disponibles >= cantidad)
        {
            entrada.disponibles -= cantidad;
            let resultado = await evento.save();
            res.status(200).send({ ok: true, resultado: resultado });
        }
        else
            res.status(404).send({ ok: false, error: `Error actualizando entradas del evento ${req.params.idEvento}` });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error actualizando entradas del evento ${req.params.idEvento}` });
    }
});

export default router;
