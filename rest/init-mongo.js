const fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://root:example@db:27017/';
const dbName = 'test'; 
const collectionName = 'Pokedex';

MongoClient.connect(url, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;

    const db = client.db(dbName);
    const pokemons = JSON.parse(fs.readFileSync('./pokemons.json', 'utf8'));

    db.collection(collectionName).insertMany(pokemons, (err, res) => {
        if (err) throw err;
        console.log(`${res.insertedCount} Pokemons inserted!`);
        client.close();
    });
});
