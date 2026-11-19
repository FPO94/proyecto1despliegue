import express from 'express';
import Evento from '../models/evento.js';
import Recinto from '../models/recinto.js';

const router = express.Router();

// PUT /eventos/entradas/:idEvento/:tipoEntrada/:cantidad
router.put('/entradas/:idEvento/:tipoEntrada/:cantidad', async (req, res) => {
    try {
        const cantidad = Number(req.params.cantidad);
        const evento = await Evento.findById(req.params.idEvento);
        if (!evento) throw new Error();
        const entrada = evento.entradas.find(e => e.tipo === req.params.tipoEntrada);
        if (!entrada) throw new Error();
        if (cantidad <= 0 || entrada.disponibles < cantidad) throw new Error();
        entrada.disponibles -= cantidad;
        const resultado = await evento.save();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error actualizando entradas del evento ${req.params.idEvento}` });
    }
});

// GET /eventos/entradas/:idEvento/:tipoEntrada
router.get('/entradas/:idEvento/:tipoEntrada', async (req, res) => {
    try {
        const evento = await Evento.findById(req.params.idEvento);
        if (!evento) throw new Error();
        const entrada = evento.entradas.find(e => e.tipo === req.params.tipoEntrada);
        if (!entrada) throw new Error();
        res.status(200).send({
            ok: true,
            resultado: { precio: entrada.precio, disponibles: entrada.disponibles }
        });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error obteniendo datos de entrada para evento ${req.params.idEvento}` });
    }
});

// GET /eventos/localidad/:nombre
router.get('/localidad/:nombre', async (req, res) => {
    try {
        const recintos = await Recinto.find({ localidad: req.params.nombre });
        const ids = recintos.map(r => r._id);
        const resultado = await Evento.find({ recinto: { $in: ids }, fecha: { $gte: new Date() } });
        if (resultado.length === 0) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: 'No se han encontrado eventos' });
    }
});

// GET /eventos
router.get('/', async (req, res) => {
    try {
        const resultado = await Evento.find().populate('recinto');
        if (resultado.length === 0) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'No se han encontrado eventos' });
    }
});

// GET /eventos/:id
router.get('/:id', async (req, res) => {
    try {
        const resultado = await Evento.findById(req.params.id);
        if (!resultado) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Evento ${req.params.id} no encontrado` });
    }
});

// POST /eventos
router.post('/', async (req, res) => {
    try {
        const nuevoEvento = new Evento(req.body);
        const resultado = await nuevoEvento.save();
        res.status(201).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error añadiendo evento' });
    }
});

// PUT /eventos/:id
router.put('/:id', async (req, res) => {
    try {
        const resultado = await Evento.findByIdAndUpdate(req.params.id, req.body, { returnDocument: 'after' });
        if (!resultado) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error actualizando evento ${req.params.id}` });
    }
});

// DELETE /eventos/:id
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await Evento.findByIdAndDelete(req.params.id);
        if (!resultado) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error eliminando evento ${req.params.id}` });
    }
});

export default router;
