const sequelize = require('./database');
const Store = require('./models/Store');
const fetch = require('node-fetch');

const stores = [
  {
    name: 'Sams Club Aracaju',
    address: {
      cep: '49025100',
      street: 'Av Deputado Silvio Teixeira',
      number: '870',
      city: 'Aracaju',
      state: 'SE'
    }
  },
  {
    name: 'Padaria Vera Cruz',
    address: {
      cep: '0306400',
      street: 'Av Celso Garcia',
      number: '3784',
      city: 'Tatuapé',
      state: 'SP'
    }
  },
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
    name: 'Loja Fictícia A',
    address: {
      cep: '01001000',
      street: 'Praça da Sé',
      number: '100',
      city: 'São Paulo',
      state: 'SP'
    }
  }
];

async function getCoordinates(cep) {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${cep}&country=Brazil&format=json`);
  const data = await response.json();
  if (data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon)
    };
  } else {
    throw new Error('CEP não encontrado');
  }
}

sequelize.sync({ force: true }).then(async () => {
  for (const store of stores) {
    try {
      const { latitude, longitude } = await getCoordinates(store.address.cep);
      store.latitude = latitude;
      store.longitude = longitude;
    } catch (err) {
      console.error(`Erro ao obter coordenadas para o CEP ${store.address.cep}:`, err);
    }
  }
  await Store.bulkCreate(stores);
  console.log('Banco de dados populado com sucesso');
  process.exit();
}).catch(err => {
  console.error('Erro ao popular o banco de dados:', err);
  process.exit(1);
});