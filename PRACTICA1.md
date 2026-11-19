# Práctica 1 – API REST de eventos (Express + Mongoose)

Especificación completa para implementar la práctica. Todo lo que aparece en los apartados 0–5 sale del enunciado
(`Despliegue_Practica1_26_27.pdf`), de una decisión explícita del alumno (marcada como **[Decisión]**) o es el
detalle técnico mínimo necesario para implementar lo que pide el enunciado (consultas de Mongoose, orden de rutas…).
No se debe añadir nada que no esté aquí. Los apartados 6–8 (pruebas, GitHub, Atlas/Render) son una guía
de apoyo pedida por el alumno; no añaden requisitos al código.

---

## 0. Reglas obligatorias (incumplirlas = suspenso o 0 en el apartado)

1. **Estructura de carpetas**: modelos en `models/`, enrutadores en `routes/`, servidor en `index.js`.
   Nada de carpeta `controllers/` (el enunciado lo pone como ejemplo de práctica suspensa).
2. **ES Modules** en todo el proyecto (`import` / `export`). Nada de `require` ni `module.exports`. **[Decisión]**
   - `package.json` con `"type": "module"`.
   - Los imports de ficheros propios llevan extensión `.js` (`import Evento from '../models/evento.js'`).
3. **`async/await` + `try/catch` en TODOS los endpoints**. No usar `.then()/.catch()` en ningún sitio.
4. **Variables de entorno en `.env`**: como mínimo `PORT` y `MONGODB_URI`, cargadas con `dotenv`. **[Decisión]**
5. **Formato de respuesta idéntico en todos los endpoints**:
   - Éxito: `{ ok: true, resultado: ... }`
   - Error: `{ ok: false, error: "mensaje" }`
   - `ok` es `false` en cualquier error 4xx o 5xx (los 404 incluidos).
   - Siempre se responde con `res.status(codigo).send({ ... })` (la misma forma en todos los endpoints).
   - Los nombres de campo (`ok`, `resultado`, `error`), los códigos de estado y los textos de error
     deben coincidir **exactamente** con este documento (mayúsculas, tildes y espacios incluidos).
     Si no coinciden, el endpoint vale 0.
6. Los nombres de campo de los esquemas deben coincidir exactamente con los del enunciado (mayúsculas y minúsculas).
7. La base de datos se llama **`eventos`**.

---

## 1. Estructura del proyecto

```
eventos/
├── models/
│   ├── evento.js        # esquema de entradas + esquema de eventos + modelo 'eventos'
│   └── recinto.js       # esquema de recintos + modelo 'recintos'
├── routes/
│   ├── eventos.js       # endpoints /eventos y /eventos/entradas/...
│   └── recintos.js      # endpoints /recintos
├── .env                 # PORT y MONGODB_URI (NO se sube a GitHub)
├── .gitignore
├── index.js
└── package.json
```

### Dependencias
```
npm init -y
npm install express mongoose dotenv
```
- Express: la última versión que instale npm **[Decisión]** (a fecha de hoy: express 5.x, mongoose 9.x, dotenv 18.x).
- `package.json`:
  - `"type": "module"`
  - `"main": "index.js"`
  - script `"start": "node index.js"` (Render lo usa como comando de arranque)

### `.env` (local)
```
PORT=8080
MONGODB_URI=mongodb://127.0.0.1:27017/eventos
```
(El puerto es libre: el enunciado dice "por el puerto que se quiera".)

### `.gitignore`
```
node_modules/
.env
```

---

## 2. Modelos (`models/`)

### 2.1 `models/recinto.js`

| Campo         | Tipo   | Obligatorio | Validación      |
|---------------|--------|-------------|-----------------|
| `nombre`      | String | sí          | `minlength: 5`  |
| `direccion`   | String | sí          | `minlength: 10` |
| `localidad`   | String | sí          | `minlength: 3`  |
| `aforoMaximo` | Number | **no**      | —               |

- Modelo: `mongoose.model('recintos', recintoSchema)`. **[Decisión: el primer argumento es literalmente `'recintos'`]**
- `export default` del modelo.

### 2.2 `models/evento.js`

En el **mismo fichero** se definen dos esquemas:

**a) Esquema de entradas (subdocumento)**

| Campo         | Tipo   | Obligatorio | Validación                                         |
|---------------|--------|-------------|----------------------------------------------------|
| `tipo`        | String | sí          | `minlength: 3`                                     |
| `precio`      | Number | sí          | `min: 0`                                           |
| `disponibles` | Number | sí          | `min: 0` **y entero** (validador `Number.isInteger`) |

No se crea modelo para las entradas: solo el esquema.

**b) Esquema de eventos**

| Campo      | Tipo                              | Obligatorio | Validación / notas          |
|------------|-----------------------------------|-------------|-----------------------------|
| `nombre`   | String                            | sí          | `minlength: 5`              |
| `fecha`    | Date                              | sí          | —                           |
| `entradas` | `[entradaSchema]`                 | —           | array de subdocumentos      |
| `recinto`  | `mongoose.Schema.Types.ObjectId`  | sí          | `ref: 'recintos'`           |

- Modelo: `mongoose.model('eventos', eventoSchema)`. **[Decisión]**
- `export default` del modelo.
- El `ref` tiene que ser `'recintos'` (el mismo nombre del modelo de recintos) para que funcione `populate`.

---

## 3. Endpoints de recintos (`routes/recintos.js`)

Se monta en `index.js` con `app.use('/recintos', recintos)`. Dentro del router las rutas son relativas (`/`, `/:id`, …).

**Orden de definición**: `/localidad/:nombre` va antes de `/:id`.

| Método | Ruta | Operación | Éxito | Error |
|---|---|---|---|---|
| GET | `/recintos` | `Recinto.find()` | **200** `{ ok: true, resultado: [recintos] }` (solo si hay **al menos uno**) | **500** `{ ok: false, error: "No se han encontrado recintos" }` (lista vacía **o** excepción) |
| GET | `/recintos/:id` | `Recinto.findById(id)` | **200** `{ ok: true, resultado: recinto }` | **404** `{ ok: false, error: "Recinto X no encontrado" }` (null **o** excepción) |
| GET | `/recintos/localidad/:nombre` | `Recinto.find({ localidad: nombre })` | **200** `{ ok: true, resultado: [recintos] }` (al menos uno) | **404** `{ ok: false, error: "No se han encontrado recintos de la localidad indicada" }` (vacío **o** excepción) |
| POST | `/recintos` | `new Recinto(req.body).save()` | **201** `{ ok: true, resultado: recintoCreado }` | **500** `{ ok: false, error: "Error añadiendo recinto" }` |
| DELETE | `/recintos/:id` | `Recinto.findByIdAndDelete(id)` | **200** `{ ok: true, resultado: recintoEliminado }` | **404** `{ ok: false, error: "Error eliminando recinto X" }` (null **o** excepción) |

- `X` = el `id` tal cual llega en la URL (`req.params.id`).
- La localidad se compara con **coincidencia exacta** (distingue mayúsculas): `{ localidad: req.params.nombre }`. **[Decisión]**
- El caso "vacío" / "null" se trata igual que la excepción: dentro del `try` se comprueba el resultado y,
  si no es válido, se responde con el error (o se lanza un error para que lo capture el `catch`).
  En los dos casos se devuelve **el mismo código y el mismo mensaje**.

Patrón de referencia (el mismo en todos los endpoints):
```js
router.get('/:id', async (req, res) => {
    try {
        const resultado = await Recinto.findById(req.params.id);
        if (!resultado) throw new Error();
        res.status(200).send({ ok: true, resultado: resultado });
    } catch (error) {
        res.status(404).send({ ok: false, error: `Recinto ${req.params.id} no encontrado` });
    }
});
```

---

## 4. Endpoints de eventos y entradas (`routes/eventos.js`)

Se monta en `index.js` con `app.use('/eventos', eventos)`.

**Orden de definición**: primero `/entradas/:idEvento/:tipoEntrada/:cantidad`, `/entradas/:idEvento/:tipoEntrada`
y `/localidad/:nombre`, y después las rutas con `/:id`.

### 4.1 Eventos

| Método | Ruta | Operación | Éxito | Error |
|---|---|---|---|---|
| GET | `/eventos` | `Evento.find().populate('recinto')` | **200** `{ ok: true, resultado: [eventos] }` (al menos uno) | **500** `{ ok: false, error: "No se han encontrado eventos" }` (vacío **o** excepción) |
| GET | `/eventos/:id` | `Evento.findById(id)` | **200** `{ ok: true, resultado: evento }` | **404** `{ ok: false, error: "Evento X no encontrado" }` (null **o** excepción) |
| GET | `/eventos/localidad/:nombre` | ver abajo | **200** `{ ok: true, resultado: [eventos] }` (al menos uno) | **404** `{ ok: false, error: "No se han encontrado eventos" }` (vacío **o** excepción) |
| POST | `/eventos` | `new Evento(req.body).save()` | **201** `{ ok: true, resultado: eventoCreado }` | **500** `{ ok: false, error: "Error añadiendo evento" }` |
| PUT | `/eventos/:id` | `Evento.findByIdAndUpdate(id, req.body, { returnDocument: 'after' })` | **200** `{ ok: true, resultado: eventoActualizado }` | **404** `{ ok: false, error: "Error actualizando evento X" }` (null **o** excepción) |
| DELETE | `/eventos/:id` | `Evento.findByIdAndDelete(id)` | **200** `{ ok: true, resultado: eventoEliminado }` | **404** `{ ok: false, error: "Error eliminando evento X" }` (null **o** excepción) |

- **`populate('recinto')` solo en `GET /eventos`**, que es donde lo pide el enunciado. El resto de endpoints devuelven el ID del recinto. **[Decisión]**
  Las entradas son subdocumentos, así que ya vienen incluidas sin `populate`.
- `PUT /eventos/:id`: `returnDocument: 'after'` hace que se devuelva el evento **actualizado** (lo pide el enunciado).
  Es el equivalente de `new: true`, que en Mongoose 9 está obsoleto (funciona, pero muestra un aviso de deprecación).

**`GET /eventos/localidad/:nombre`**: eventos cuyo recinto esté en esa localidad **y cuya fecha aún no haya pasado**.
1. `const recintos = await Recinto.find({ localidad: req.params.nombre });` (coincidencia exacta **[Decisión]**)
2. `const ids = recintos.map(r => r._id);`
3. `const resultado = await Evento.find({ recinto: { $in: ids }, fecha: { $gte: new Date() } });`
4. Si `resultado.length > 0` → 200; si no → 404 con `"No se han encontrado eventos"`.

(Este router importa también el modelo `Recinto`.)

### 4.2 Entradas

| Método | Ruta | Éxito | Error |
|---|---|---|---|
| GET | `/eventos/entradas/:idEvento/:tipoEntrada` | **200** `{ ok: true, resultado: { precio, disponibles } }` | **404** `{ ok: false, error: "Error obteniendo datos de entrada para evento X" }` |
| PUT | `/eventos/entradas/:idEvento/:tipoEntrada/:cantidad` | **200** `{ ok: true, resultado: eventoActualizado }` | **404** `{ ok: false, error: "Error actualizando entradas del evento X" }` |

`X` = `req.params.idEvento`.

**GET entradas**
1. `const evento = await Evento.findById(req.params.idEvento);`
2. Si `evento` es null → error.
3. `const entrada = evento.entradas.find(e => e.tipo === req.params.tipoEntrada);`
4. Si no existe `entrada` → error.
5. Respuesta: `resultado: { precio: entrada.precio, disponibles: entrada.disponibles }` (**solo** esos dos subcampos).
6. Cualquier excepción (id mal formado, etc.) → 404 con el mismo mensaje.

**PUT entradas**
1. `const cantidad = Number(req.params.cantidad);`
2. `const evento = await Evento.findById(req.params.idEvento);` → si es null, error.
3. Se busca la entrada del `tipoEntrada` → si no existe, error.
4. Si `cantidad <= 0 || entrada.disponibles < cantidad` → error.
   - `entrada.disponibles < cantidad`: no hay tantas entradas que restar (lo pide el enunciado).
   - `cantidad <= 0`: necesario para que la operación funcione como una resta; sin esto, con `-5`
     se sumarían entradas en vez de restarlas. Devuelve el mismo 404 y el mismo mensaje.
5. `entrada.disponibles -= cantidad;` y `await evento.save();` (al guardar se aplican las validaciones del subesquema).
6. Respuesta 200 con `resultado: evento` (el evento con sus entradas actualizadas).
7. Cualquier fallo → 404 con `"Error actualizando entradas del evento X"`.

---

## 5. Servidor principal (`index.js`)

En este orden (los pasos que indica el enunciado):
1. **Cargar las librerías**: `express`, `mongoose`, `dotenv` y los dos enrutadores (`./routes/recintos.js`, `./routes/eventos.js`).
2. **Cargar `.env`**: `dotenv.config();`
3. **Conectar con la base de datos** con `await` + `try/catch` (coherente con el resto del proyecto, sin `.then/.catch`).
   Con ES Modules se puede usar `await` a nivel superior:
   ```js
   try {
       await mongoose.connect(process.env.MONGODB_URI);
       console.log('Conectado a MongoDB');
   } catch (error) {
       console.log('Error conectando a MongoDB:', error.message);
   }
   ```
4. **Crear la app Express** y activar el middleware JSON: `app.use(express.json());`
5. **Cargar los enrutadores**:
   ```js
   app.use('/recintos', recintos);
   app.use('/eventos', eventos);
   ```
6. **Arrancar el servidor**: `app.listen(process.env.PORT);`

---

## 6. Pruebas de los endpoints

Base URL local: `http://localhost:8080` · Remota: `https://xxxxx.onrender.com` (las mismas rutas).

### Datos de ejemplo

Recinto (POST `/recintos`):
```json
{
  "nombre": "Palacio de Congresos",
  "direccion": "Avenida Principal 123",
  "localidad": "Alicante",
  "aforoMaximo": 5000
}
```

Evento (POST `/eventos`, sustituyendo `<ID_RECINTO>` y con una fecha futura):
```json
{
  "nombre": "Summer Party 2027",
  "fecha": "2027-07-15T22:00:00.000Z",
  "recinto": "<ID_RECINTO>",
  "entradas": [
    { "tipo": "VIP", "precio": 80, "disponibles": 50 },
    { "tipo": "General", "precio": 25, "disponibles": 500 }
  ]
}
```

### Checklist de pruebas (comprobar código de estado + cuerpo)

| # | Petición | Esperado |
|---|---|---|
| 1 | GET `/recintos` (con la BD vacía) | 500, `"No se han encontrado recintos"` |
| 2 | POST `/recintos` (cuerpo válido) | 201, `resultado` con `_id` |
| 3 | POST `/recintos` (`nombre: "abc"`) | 500, `"Error añadiendo recinto"` |
| 4 | GET `/recintos` | 200, array |
| 5 | GET `/recintos/<id>` | 200 |
| 6 | GET `/recintos/123` (id inválido) | 404, `"Recinto 123 no encontrado"` |
| 7 | GET `/recintos/localidad/Alicante` | 200 |
| 8 | GET `/recintos/localidad/Nada` | 404, `"No se han encontrado recintos de la localidad indicada"` |
| 9 | GET `/eventos` (vacío) | 500, `"No se han encontrado eventos"` |
| 10 | POST `/eventos` (válido) | 201 |
| 11 | POST `/eventos` (sin `recinto`) | 500, `"Error añadiendo evento"` |
| 12 | POST `/eventos` (`disponibles: 2.5`) | 500, `"Error añadiendo evento"` |
| 13 | GET `/eventos` | 200, `recinto` como objeto completo (populate) |
| 14 | GET `/eventos/<id>` / `/eventos/123` | 200 / 404 `"Evento 123 no encontrado"` |
| 15 | GET `/eventos/localidad/Alicante` | 200 (solo eventos con fecha futura) |
| 16 | GET `/eventos/localidad/Alicante` habiendo solo eventos pasados | 404, `"No se han encontrado eventos"` |
| 17 | PUT `/eventos/<id>` `{ "nombre": "Nuevo nombre" }` | 200, evento ya actualizado |
| 18 | PUT `/eventos/123` | 404, `"Error actualizando evento 123"` |
| 19 | GET `/eventos/entradas/<id>/VIP` | 200, `resultado: { precio, disponibles }` |
| 20 | GET `/eventos/entradas/<id>/Palco` | 404, `"Error obteniendo datos de entrada para evento <id>"` |
| 21 | PUT `/eventos/entradas/<id>/VIP/5` | 200, VIP `disponibles` baja en 5 |
| 22 | PUT `/eventos/entradas/<id>/VIP/99999` | 404, `"Error actualizando entradas del evento <id>"` |
| 22b | PUT `/eventos/entradas/<id>/VIP/-5` | 404, `"Error actualizando entradas del evento <id>"` (no cambia `disponibles`) |
| 23 | DELETE `/eventos/<id>` / `/eventos/123` | 200 / 404 `"Error eliminando evento 123"` |
| 24 | DELETE `/recintos/<id>` / `/recintos/123` | 200 / 404 `"Error eliminando recinto 123"` |

En **todas** las respuestas tiene que aparecer `ok` (`true` en 200/201, `false` en 404/500).

---

## 7. Subir a GitHub

1. Comprobar que `.gitignore` excluye `node_modules/` y `.env`.
2. `git init` → `git add .` → `git commit -m "Práctica 1"`.
3. Crear un repositorio en GitHub, añadirlo como remoto y hacer `push`.
4. Comprobar en GitHub que **no** aparecen `node_modules` ni `.env`.

(Alternativa de entrega: el proyecto comprimido **sin** `node_modules`.)

---

## 8. Despliegue: MongoDB Atlas + Render

### 8.1 MongoDB Atlas
1. Crear un cluster gratuito (M0).
2. **Database Access**: crear un usuario con contraseña.
3. **Network Access**: permitir `0.0.0.0/0` (Render no tiene IP fija).
4. **Connect → Drivers**: copiar la cadena `mongodb+srv://...` y poner el usuario, la contraseña y el
   nombre de la BD **`eventos`** antes del `?`:
   ```
   mongodb+srv://USUARIO:PASSWORD@cluster0.xxxxx.mongodb.net/eventos?retryWrites=true&w=majority
   ```

### 8.2 Render
1. New → **Web Service** → conectar el repositorio de GitHub.
2. Runtime: Node · Build Command: `npm install` · Start Command: `npm start`.
3. **Environment Variables**: `MONGODB_URI` = la cadena de Atlas.
   (`PORT` lo inyecta Render automáticamente; como el código usa `process.env.PORT`, funciona sin añadirlo.)
4. Desplegar y probar `https://xxxxx.onrender.com/recintos` y el resto del checklist del apartado 6.
5. Hacer capturas de las pruebas en remoto (opcional: el enunciado dice que "se puede adjuntar alguna captura").

---

## 9. Entrega
- URL del repositorio de GitHub (o zip sin `node_modules`).
- URL de Render (`xxxxx.onrender.com`).
- Capturas de las pruebas en remoto (opcional).

> El profesorado puede hacer una evaluación oral: hay que entender cada línea del código.

---

## 10. Puntuación (referencia)
- Esquema de eventos con validaciones: 0,75
- Esquema de entradas como subdocumento: 0,5
- Esquema de recinto + relación por ID: 0,75
- 13 endpoints × 0,5 = 6,5
- Servidor principal: 0,5
- Despliegue Render + Atlas: 1
