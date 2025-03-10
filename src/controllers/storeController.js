const Store = require('../models/Store');
const axios = require('axios');
const logger = require('../logger');

const ORS_API_KEY = "5b3ce3597851110001cf62484df37b8915bf4a48a3d451ee6eb80b7b";

exports.createStore = async (req, res) => {
  try {
    const { name, cep, number } = req.body;
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    const addressData = response.data;

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
    logger.error('Erro ao criar loja: %o', err);
    res.status(500).json({ message: err.message });
  }
};

exports.findStoresByCep = async (req, res) => {
  try {
    const { cep } = req.params;
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
    logger.error('Erro ao buscar lojas por CEP: %o', err);
    res.status(500).json({ message: err.message });
  }
};

async function getCoordinates(cep) {
  try {
    const response = await axios.get(`https://api.openrouteservice.org/geocode/search`, {
      params: {
        api_key: ORS_API_KEY,
        text: cep,
        boundary_country: 'BR'
      }
    });
    const data = response.data;
    if (data.features.length > 0) {
      const location = data.features[0].geometry.coordinates;
      return {
        latitude: location[1],
        longitude: location[0]
      };
    } else {
      throw new Error('CEP não encontrado');
    }
  } catch (error) {
    logger.error('Erro ao buscar coordenadas: %o', error);
    throw new Error('Erro ao buscar coordenadas: ' + error.message);
  }
}

async function calculateRouteDistance(lat1, lon1, lat2, lon2) {
  try {
    const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`);
    const data = response.data;
    if (data.routes.length > 0) {
      return data.routes[0].distance / 1000;
    } else {
      throw new Error('Rota não encontrada');
    }
  } catch (error) {
    logger.error('Erro ao calcular a rota: %o', error);
    throw new Error('Erro ao calcular a rota: ' + error.message);
  }
}