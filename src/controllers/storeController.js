const Store = require('../models/Store');
const fetch = require('node-fetch');
const OSRM = require('osrm-client');

const osrm = new OSRM('http://router.project-osrm.org');

exports.createStore = async (req, res) => {
  try {
    const { name, cep, number } = req.body;
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const addressData = await response.json();

    if (addressData.erro) {
      return res.status(400).json({ message: 'CEP inválido' });
    }

    const store = await Store.create({
      name,
      address: {
        cep,
        street: addressData.logradouro,
        number,
        city: addressData.localidade,
        state: addressData.uf
      }
    });

    res.status(201).json(store);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.findStoresByCep = async (req, res) => {
  try {
    const { cep } = req.params;
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const addressData = await response.json();

    if (addressData.erro) {
      return res.status(400).json({ message: 'CEP inválido' });
    }

    const userCoordinates = await getCoordinates(cep);

    const stores = await Store.findAll();

    const storesWithDistance = await Promise.all(stores.map(async store => {
      const storeCoordinates = await getCoordinates(store.address.cep);
      const distance = await calculateRouteDistance(userCoordinates.latitude, userCoordinates.longitude, storeCoordinates.latitude, storeCoordinates.longitude);
      return { ...store.toJSON(), distance, latitude: storeCoordinates.latitude, longitude: storeCoordinates.longitude };
    }));

    storesWithDistance.sort((a, b) => a.distance - b.distance);

    if (storesWithDistance.length === 0) {
      return res.status(404).json({ message: 'Nenhuma loja encontrada próxima ao CEP informado' });
    }

    res.json(storesWithDistance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

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

async function calculateRouteDistance(lat1, lon1, lat2, lon2) {
  const route = await osrm.route({
    coordinates: [[lon1, lat1], [lon2, lat2]],
    overview: 'false',
    steps: false
  });

  if (route.routes.length > 0) {
    return route.routes[0].distance / 1000;
  } else {
    throw new Error('Rota não encontrada');
  }
}