//dependencias
const express = require('express')

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


