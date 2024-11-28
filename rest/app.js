//dependencias
const express = require('express')
const redis = require('redis')

//configuracion
const connectDB = require('./config/database')
const setupSwagger = require('./config/swagger')

//rutas
const pokedex = require('./routes/pokedex')

//middleware
const index = require('./middleware/index')
const notFound = require('./middleware/notFound')

const app = express()
app.use(express.json())

// Conectar a la base de datos
connectDB()

// Configurar Redis
const client = redis.createClient({
    url: 'redis://redis:6379'
})

// Manejo de errores de Redis
client.on('error', (err) => console.error('Redis error:', err))

// Conectar el cliente Redis de forma asíncrona
async function startServer() {
  try {
    await client.connect()  // Aseguramos que Redis se conecta antes de iniciar el servidor

    // Inicializar Swagger
    setupSwagger(app)

    // Definir rutas
    app.get("/", index)
    app.use("/pokedex", pokedex)
    app.use(notFound)

    // Iniciar el servidor
    const port = 3000
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
  } catch (err) {
    console.error('Failed to connect to Redis:', err)
  }
}

startServer()
