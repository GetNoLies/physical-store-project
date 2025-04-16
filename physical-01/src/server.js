const express = require('express');
const winston = require('winston');
const storeRoutes = require('./routes/storeRoutes');
const sequelize = require('./database');

const app = express();
const port = process.env.PORT || 3000;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

app.use(express.json());

app.use('/api', storeRoutes);

sequelize.sync().then(() => {
  app.listen(port, () => {
    logger.info(`Servidor rodando na porta ${port}`);
  });
}).catch(err => {
  logger.error('Erro ao sincronizar o banco de dados', err);
});