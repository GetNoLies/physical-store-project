const Store = require('../models/Store');
const fetch = require('node-fetch');

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
      const distance = calculateDistance(userCoordinates.latitude, userCoordinates.longitude, storeCoordinates.latitude, storeCoordinates.longitude);
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

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}