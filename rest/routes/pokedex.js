const express = require('express')
const axios = require('axios');
const pokedex = express.Router()
const Pokemon = require('../schema/pokemon')

const redisClient = require('redis').createClient({
    url: 'redis://redis:6379'
})
redisClient.connect()

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
    const cacheKey = `pokemons:page:${page}:limit:${limit}`

    try {
        const cachedPokemons = await redisClient.get(cacheKey); 

        if (cachedPokemons) {
            return res.json(JSON.parse(cachedPokemons)); 
        }

        const pokemons = await Pokemon.find()
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Pokemon.countDocuments();

        const result = {
            totalPokemons: total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            pokemons
        };

        await redisClient.set(cacheKey, JSON.stringify(result), {
            EX: 3600 
        });

        res.json(result);

    } catch (error) {
        res.status(500).send(error.message);
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
        // Buscar el Pokémon por su ID en MongoDB
        const pokemon = await Pokemon.findOne({ id: req.params.id });

        if (!pokemon) {
            return res.status(404).json({ error: 'Pokemon not found' });
        }

        // Si el Pokémon tiene un trainer_id, hacemos la solicitud a la API SOAP
        if (pokemon.trainer_id) {
            try {
                // Realizar una solicitud HTTP a la API SOAP para obtener el entrenador
                const response = await axios.get(`http://soap-api:4000/trainers/${pokemon.trainer_id}`);
                
                // Añadir los datos del entrenador al Pokémon
                pokemon.trainer = response.data; 
            } catch (error) {
                console.error('Error al obtener el entrenador:', error.message);
                pokemon.trainer = null; // Si ocurre un error, asignamos null al atributo trainer
            }
        }

        // Devolver la información del Pokémon junto con el entrenador
        res.json(pokemon);
    } catch (error) {
        console.error('Error al obtener el Pokémon:', error.message);
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

    const cacheKey = `pokemons:${type}:page:${page}`;

    try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            return res.json(JSON.parse(cachedData)); 
        }

        const pokemons = await Pokemon.find({ type })
            .skip(skip)
            .limit(limit);

        await redisClient.setEx(cacheKey, 600, JSON.stringify(pokemons));

        res.json(pokemons);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
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
