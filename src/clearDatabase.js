const sequelize = require('./database');
const Store = require('./models/Store');

sequelize.sync({ force: true }).then(async () => {
  console.log('Banco de dados limpo');
  process.exit();
}).catch(err => {
  console.error('Erro ao limpar o banco de dados:', err);
  process.exit(1);
});