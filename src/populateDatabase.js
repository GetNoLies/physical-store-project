const sequelize = require('./database');
const Store = require('./models/Store');

const stores = [
  {
    name: 'Loja Fictícia A',
    address: {
      cep: '01001000',
      street: 'Praça da Sé',
      number: '100',
      city: 'São Paulo',
      state: 'SP'
    }
  },
  {
    name: 'Loja Fictícia B',
    address: {
      cep: '02002000',
      street: 'Avenida Paulista',
      number: '200',
      city: 'São Paulo',
      state: 'SP'
    }
  }
];

sequelize.sync({ force: true }).then(async () => {
  await Store.bulkCreate(stores);
  console.log('Banco de dados populado com os dados inseridos');
  process.exit();
}).catch(err => {
  console.error('Erro ao popular o banco de dados:', err);
  process.exit(1);
});