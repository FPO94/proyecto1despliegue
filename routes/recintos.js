import express from 'express';
import Recinto from '../models/recinto.js';

const router = express.Router();

// GET /recintos
router.get('/', async (req, res) => {
    try {
        const resultado = await Recinto.find();
        if (resultado.length === 0) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'No se han encontrado recintos' });
    }
});

// GET /recintos/localidad/:nombre
router.get('/localidad/:nombre', async (req, res) => {
    try {
        const resultado = await Recinto.find({ localidad: req.params.nombre });
        if (resultado.length === 0) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: 'No se han encontrado recintos de la localidad indicada' });
    }
});

// GET /recintos/:id
router.get('/:id', async (req, res) => {
    try {
        const resultado = await Recinto.findById(req.params.id);
        if (!resultado) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Recinto ${req.params.id} no encontrado` });
    }
});

// POST /recintos
router.post('/', async (req, res) => {
    try {
        const nuevoRecinto = new Recinto(req.body);
        const resultado = await nuevoRecinto.save();
        res.status(201).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(500).send({ ok: false, error: 'Error añadiendo recinto' });
    }
});

// DELETE /recintos/:id
router.delete('/:id', async (req, res) => {
    try {
        const resultado = await Recinto.findByIdAndDelete(req.params.id);
        if (!resultado) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Error eliminando recinto ${req.params.id}` });
    }
});

export default router;
