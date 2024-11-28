const mongoose = require('mongoose');

const evolutionSchema = new mongoose.Schema({
    num: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    }
});

const pokemonSchema = new mongoose.Schema({
    trainer_id:{
        type: Number,
        required: true
    },
    id: {
        type: Number,
        required: true
    },
    num: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    type: {
        type: [String], 
        required: true
    },
    height: {
        type: String,
        required: true
    },
    weight: {
        type: String,
        required: true
    },
    candy: {
        type: String,
        required: true
    },
    candy_count: {
        type: Number
    },
    egg: {
        type: String,
        required: true
    },
    spawn_chance: {
        type: Number,
        required: true
    },
    avg_spawns: {
        type: Number,
        required: true
    },
    spawn_time: {
        type: String,
        required: true
    },
    multipliers: {
        type: [Number]
    },
    weaknesses: {
        type: [String], 
        required: true
    },
    prev_evolution: [evolutionSchema], 
    next_evolution: [evolutionSchema] 
});

const Pokemon = mongoose.model('Pokemon', pokemonSchema, 'Pokedex');

module.exports = Pokemon;
