const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Pokedex API',
      version: '1.0.0',
      description: 'API RESTful de una pokedex',
    },
    servers: [
      {
        url: 'http://localhost:3000', 
      },
    ],
  },
  apis: ['./routes/pokedex.js', './schema/pokemon.js']
};

const swaggerSpec = swaggerJsdoc(options);

const setupSwagger = (app) => {
  app.use('/swaggerIndex', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};

module.exports = setupSwagger;
