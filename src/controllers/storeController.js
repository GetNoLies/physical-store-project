const Store = require('../models/Store');
const fetch = require('node-fetch');
const axios = require('axios');

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

    const storesWithin100km = storesWithDistance.filter(store => store.distance <= 100);

    storesWithin100km.sort((a, b) => a.distance - b.distance);

    if (storesWithin100km.length === 0) {
      return res.status(404).json({ message: 'Nenhuma loja encontrada próxima ao CEP informado' });
    }

    res.json(storesWithin100km);
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
  const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
  const data = response.data;
  if (data.routes.length > 0) {
    return data.routes[0].distance / 1000;
  } else {
    throw new Error('Rota não encontrada');
  }
}