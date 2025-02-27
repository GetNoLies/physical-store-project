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
      },
      latitude: parseFloat(addressData.latitude),
      longitude: parseFloat(addressData.longitude)
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

    const stores = await Store.findAll({
      where: sequelize.literal(`ST_Distance(location, ST_GeomFromText('POINT(${parseFloat(addressData.longitude)} ${parseFloat(addressData.latitude)})')) <= 100000`)
    });

    if (stores.length === 0) {
      return res.status(404).json({ message: 'Nenhuma loja encontrada próxima ao CEP informado' });
    }

    res.json(stores);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};