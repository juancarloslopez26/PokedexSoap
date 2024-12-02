const express = require('express')
const axios = require('axios');
const { parseStringPromise } = require('xml2js'); 
const pokedex = express.Router()
const Pokemon = require('../schema/pokemon')

/**
 * @swagger
 * components:
 *   schemas:
 *     Evolution:
 *       type: object
 *       properties:
 *         num:
 *           type: string
 *           description: Número de evolución del Pokémon.
 *         name:
 *           type: string
 *           description: Nombre de la evolución.
 *     Trainer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID único del entrenador.
 *         nombre:
 *           type: string
 *           description: Nombre del entrenador.
 *         edad:
 *           type: integer
 *           description: Edad del entrenador.
 *         pokemonId:
 *           type: string
 *           description: ID del Pokémon que tiene el entrenador.
 *     Pokemon:
 *       type: object
 *       properties:
 *         trainer_id:
 *           type: number
 *           description: ID del entrenador que posee el Pokémon.    
 *         id:
 *           type: number
 *           description: ID único del Pokémon.
 *         num:
 *           type: string
 *           description: Número de la Pokédex.
 *         name:
 *           type: string
 *           description: Nombre del Pokémon.
 *         img:
 *           type: string
 *           description: URL de la imagen del Pokémon.
 *         type:
 *           type: array
 *           items:
 *             type: string
 *           description: Tipos del Pokémon (ej. Grass, Poison).
 *         height:
 *           type: string
 *           description: Altura del Pokémon.
 *         weight:
 *           type: string
 *           description: Peso del Pokémon.
 *         candy:
 *           type: string
 *           description: Tipo de caramelo del Pokémon.
 *         candy_count:
 *           type: number
 *           description: Cantidad de caramelos necesarios para evolucionar.
 *         egg:
 *           type: string
 *           description: Distancia del huevo en km.
 *         spawn_chance:
 *           type: number
 *           description: Probabilidad de aparición del Pokémon.
 *         avg_spawns:
 *           type: number
 *           description: Apariciones promedio del Pokémon.
 *         spawn_time:
 *           type: string
 *           description: Tiempo de aparición del Pokémon.
 *         multipliers:
 *           type: array
 *           items:
 *             type: number
 *           description: Multiplicadores de evolución.
 *         weaknesses:
 *           type: array
 *           items:
 *             type: string
 *           description: Debilidades del Pokémon.
 *         prev_evolution:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Evolution'
 *           description: Evolución previa del Pokémon.
 *         next_evolution:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Evolution'
 *           description: Evolución siguiente del Pokémon.
 *         trainer:
 *           $ref: '#/components/schemas/Trainer'
 *           description: Información del entrenador asociado al Pokémon.
 */


/**
 * @swagger
 * /pokedex:
 *   get:
 *     summary: Obtener todos los Pokémon
 *     description: Retorna una lista paginada de todos los Pokémon registrados.
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Número de página (por defecto: 1)."
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 4
 *         description: "Cantidad de resultados por página (por defecto: 4)."
 *     responses:
 *       200:
 *         description: Lista de Pokémon con paginación.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalPokemons:
 *                   type: integer
 *                   description: "Número total de Pokémon."
 *                 totalPages:
 *                   type: integer
 *                   description: "Número total de páginas."
 *                 currentPage:
 *                   type: integer
 *                   description: "Página actual."
 *                 pokemons:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Pokemon'
 *       500:
 *         description: Error interno del servidor.
 */

pokedex.get('/', async (req, res) => {
    const { page = 1, limit = 4 } = req.query;

    try {
        // Realiza la consulta a la base de datos para obtener los pokémons paginados
        const pokemons = await Pokemon.find()
            .skip((page - 1) * limit) // Salta los primeros "page-1" registros
            .limit(parseInt(limit));  // Limita la cantidad de resultados según "limit"

        const total = await Pokemon.countDocuments(); // Cuenta el total de documentos disponibles

        // Estructura el resultado con la paginación
        const result = {
            totalPokemons: total,
            totalPages: Math.ceil(total / limit),  // Calcula el número total de páginas
            currentPage: parseInt(page),  // Página actual
            pokemons
        };

        res.json(result); // Envía la respuesta con la lista de pokémons paginados

    } catch (error) {
        res.status(500).send(error.message); // Manejo de errores si ocurre algo
    }
});


/**
 * @swagger
 * /pokedex/name/{name}:
 *   get:
 *     summary: Buscar un pokemon por su nombre
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Se busca a un pokemon por su nombre exacto
 *     responses:
 *       200:
 *         description: A single Pokemon
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: Pokemon not found
 */

pokedex.get('/name/:name', async (req, res) => {
    try {
        const pokemon = await Pokemon.findOne({ name: req.params.name });
        if (!pokemon) {
            return res.status(404).json({ message: 'Pokemon not found' });
        }
        res.json(pokemon);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

/**
 * @swagger
 * /pokedex/{id}:
 *   get:
 *     summary: Obtener un Pokémon por su ID
 *     description: Retorna un Pokémon específico de la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: El ID del Pokémon.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Retorna el Pokémon solicitado.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Pokemon'
 *       404:
 *         description: No se encontró el Pokémon.
 *       500:
 *         description: Error interno del servidor.
 */

pokedex.get('/:id', async (req, res) => {
    try {
        // Paso 1: Buscar el Pokémon en la base de datos
        const pokemon = await Pokemon.findById(req.params.id);
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        // Paso 2: Obtener el trainer_id desde el Pokémon
        const trainerId = pokemon.trainer_id;

        // Paso 3: Construir la solicitud SOAP con el trainer_id dinámico
        const soapRequest = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="trainer.soap.api">
                <soapenv:Header/>
                <soapenv:Body>
                    <tns:GetTrainer>
                        <tns:id>${trainerId}</tns:id> <!-- Usando el trainer_id dinámico -->
                    </tns:GetTrainer>
                </soapenv:Body>
            </soapenv:Envelope>
        `;

        // Paso 4: Llamar a la API SOAP
        const response = await axios.post(
            'http://soap-api:4000/soap', // URL de tu API SOAP
            soapRequest,
            {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                },
            }
        );

        // Parsear la respuesta SOAP
        const xmlResponse = response.data;
        console.log('Respuesta XML:', xmlResponse);

        const parsedData = await parseStringPromise(xmlResponse, {
            explicitArray: false, // Simplifica el acceso eliminando arrays innecesarios
            tagNameProcessors: [(name) => name.replace(/.*:/, '')], // Remueve los prefijos de las etiquetas
        });

        const trainerData = parsedData.Envelope.Body.GetTrainerResponse.GetTrainerResult;

        // Paso 5: Combinar ambas respuestas
        const combinedResult = {
            pokemon,
            trainer: trainerData,
        };

        // Devolver la respuesta combinada
        res.json(combinedResult);
    } catch (error) {
        console.error('Error al interactuar con la API:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /pokedex/trainer:
 *   post:
 *     summary: Crear un nuevo entrenador
 *     description: Envía una solicitud SOAP para crear un entrenador en la API SOAP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: El nombre del entrenador.
 *                 example: Osvaldo
 *               age:
 *                 type: integer
 *                 description: La edad del entrenador.
 *                 example: 20
 *               pokemon_id:
 *                 type: string
 *                 description: ID del Pokémon asociado (opcional).
 *                 example: 200
 *     responses:
 *       201:
 *         description: Entrenador creado exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Trainer created successfully.
 *                 trainer:
 *                   type: object
 *                   description: Información del entrenador creado.
 *       400:
 *         description: Solicitud inválida (falta el nombre o la edad).
 *       500:
 *         description: Error interno del servidor.
 */


pokedex.post('/trainer', async (req, res) => {
    const { name, age, pokemon_id } = req.body;

    // Validación de entrada
    if (!name || !age) {
        return res.status(400).json({ error: 'Name and age are required.' });
    }

    try {
        // Construir la solicitud SOAP para crear un entrenador
        const soapRequest = `
            <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tns="trainer.soap.api">
                <soapenv:Header/>
                <soapenv:Body>
                    <tns:PostTrainer>
                        <tns:name>${name}</tns:name>
                        <tns:age>${age}</tns:age>
                        <tns:pokemon_id>${pokemon_id || ''}</tns:pokemon_id>
                    </tns:PostTrainer>
                </soapenv:Body>
            </soapenv:Envelope>
        `;

        // Hacer la solicitud a la API SOAP
        const response = await axios.post(
            'http://soap-api:4000/soap', // URL de tu API SOAP
            soapRequest,
            {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                },
            }
        );

        // Parsear la respuesta SOAP
        const xmlResponse = response.data;
        console.log('Respuesta XML:', xmlResponse);

        const parsedData = await parseStringPromise(xmlResponse, {
            explicitArray: false, // Simplifica el acceso eliminando arrays innecesarios
            tagNameProcessors: [(name) => name.replace(/.*:/, '')], // Remueve los prefijos de las etiquetas
        });

        const trainerResult = parsedData.Envelope.Body.PostTrainerResponse.PostTrainerResult;

        // Devolver la respuesta procesada al cliente
        res.status(201).json({ message: 'Trainer created successfully.', trainer: trainerResult });
    } catch (error) {
        console.error('Error al interactuar con la API SOAP:', error.message);
        res.status(500).json({ error: 'Server error' });
    }
});


/**
 * @swagger
 * /pokedex/type/{type}:
 *   get:
 *     summary: Buscar Pokémon por tipo
 *     description: Obtiene una lista de Pokémon filtrados por tipo
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: "Tipo de Pokémon a buscar (ej: Fire, Water, Grass, etc.)."
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: "Número de página (por defecto: 1)."
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 4
 *         description: "Cantidad de resultados por página (por defecto: 4)."
 *     responses:
 *       200:
 *         description: "Lista de Pokémon filtrados por tipo con paginación."
 *       500:
 *         description: "Error interno del servidor."
 */

pokedex.get('/type/:type', async (req, res) => {
    const { type } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    try {
        // Consulta la base de datos por tipo de Pokémon con paginación
        const pokemons = await Pokemon.find({ type })
            .skip(skip)
            .limit(limit);

        // Obtiene el total de Pokémon de ese tipo para calcular las páginas
        const total = await Pokemon.countDocuments({ type });

        // Estructura el resultado con la paginación
        const result = {
            totalPokemons: total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            pokemons
        };

        res.json(result); // Devuelve los pokémons filtrados por tipo con la paginación
    } catch (error) {
        res.status(500).json({ error: 'Server error' }); // Manejo de errores
    }
});

/**
 * @swagger
 * /pokedex:
 *   post:
 *     summary: Agregar un nuevo Pokémon
 *     description: Crea un nuevo Pokémon en la base de datos.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pokemon'
 *     responses:
 *       200:
 *         description: Pokémon creado exitosamente.
 *       500:
 *         description: Error interno del servidor.
 */

pokedex.post('/', async (req, res) => {
    try {
        const lastPokemon = await Pokemon.findOne().sort({ id: -1 });

        const nextId = lastPokemon ? lastPokemon.id + 1 : 1; 
        const nextNum = lastPokemon ? (parseInt(lastPokemon.num) + 1).toString().padStart(3, '0') : '001'; 

        const {
            trainer_id,
            name, 
            img, 
            type, 
            height, 
            weight, 
            candy, 
            candy_count, 
            egg, 
            spawn_chance, 
            avg_spawns, 
            spawn_time, 
            multipliers, 
            weaknesses, 
            prev_evolution, 
            next_evolution
        } = req.body;

        const pokemon = new Pokemon({
            id: nextId, 
            num: nextNum,
            trainer_id,
            name,
            img,
            type,
            height,
            weight,
            candy,
            candy_count,
            egg,
            spawn_chance,
            avg_spawns,
            spawn_time,
            multipliers,
            weaknesses,
            prev_evolution,
            next_evolution
        });

        await pokemon.save();

        res.json({ success: true, pokemon }); 
    } catch (error) {
        res.status(500).send(error.message);
    }
});

/**
 * @swagger
 * /pokedex/{id}:
 *   put:
 *     summary: Actualizar un Pokémon por ID
 *     description: Actualiza un Pokémon existente en la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del Pokémon a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Pokemon'
 *     responses:
 *       200:
 *         description: Pokémon actualizado exitosamente.
 *       404:
 *         description: Pokémon no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

pokedex.put('/:id', async (req, res) => {
    try {
        const pokemon = await Pokemon.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        res.json({ success: true, updatedPokemon: pokemon });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /pokedex/{id}:
 *   patch:
 *     summary: Actualizar parcialmente un Pokémon por ID
 *     description: Permite actualizar parcialmente un Pokémon existente en la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del Pokémon a actualizar.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               img:
 *                 type: string
 *               type:
 *                 type: array
 *                 items:
 *                   type: string
 *               height:
 *                 type: string
 *               weight:
 *                 type: string
 *               candy:
 *                 type: string
 *               candy_count:
 *                 type: number
 *               egg:
 *                 type: string
 *               spawn_chance:
 *                 type: number
 *               avg_spawns:
 *                 type: number
 *               spawn_time:
 *                 type: string
 *               multipliers:
 *                 type: array
 *                 items:
 *                   type: number
 *               weaknesses:
 *                 type: array
 *                 items:
 *                   type: string
 *               prev_evolution:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Evolution'
 *               next_evolution:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Evolution'
 *     responses:
 *       200:
 *         description: Pokémon actualizado exitosamente.
 *       404:
 *         description: Pokémon no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

pokedex.patch('/:id', async (req, res) => {
    try {
        const updates = req.body;
        const pokemon = await Pokemon.findByIdAndUpdate(req.params.id, updates, { new: true });

        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        res.json({ success: true, updatedPokemon: pokemon });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * @swagger
 * /pokedex/{id}:
 *   delete:
 *     summary: Eliminar un Pokémon por ID
 *     description: Elimina un Pokémon existente en la base de datos.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID del Pokémon a eliminar.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pokémon eliminado exitosamente.
 *       404:
 *         description: Pokémon no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

pokedex.delete('/:id', async (req, res) => {
    try {
        const pokemon = await Pokemon.findByIdAndDelete(req.params.id);
        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' }); 
        }
        res.json({ success: true, message: 'Pokemon deleted successfully', pokemon });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = pokedex
