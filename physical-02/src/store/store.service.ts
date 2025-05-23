import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { CepService, CepInfo } from './cep.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
    private readonly cepService: CepService,
    private readonly httpService: HttpService,
  ) {}

  private formatCep(cep: string): string {
    const cepNumbers = cep.replace(/\D/g, '');
    
    if (cepNumbers.length !== 8) {
      throw new Error('CEP inválido. O CEP deve conter 8 dígitos.');
    }
    
    return `${cepNumbers.substring(0, 5)}-${cepNumbers.substring(5)}`;
  }

  async listAll(limit: number = 10, offset: number = 0) {
    const [stores, total] = await this.storeRepository.findAndCount({
      skip: offset,
      take: limit,
    });

    return {
      stores,
      limit,
      offset,
      total,
    };
  }

  async findById(id: string) {
    const store = await this.storeRepository.findOne({ where: { storeID: id } });

    if (!store) {
      throw new Error('Store not found');
    }

    return {
      stores: [store],
      limit: 1,
      offset: 0,
      total: 1,
    };
  }

  async findByCep(cep: string, limit: number = 10, offset: number = 0) {
    try {
      const cepNumbers = cep.replace(/\D/g, '');
      const { latitude: cepLat, longitude: cepLng } = await this.cepService.getCoordinatesFromCep(cepNumbers);

      const pdvs = await this.storeRepository.find({ where: { type: 'PDV' } });

      let nearestPdv: Store | null = null;
      let nearestDistance = Infinity;

      const nearbyStores: any[] = [];
      for (const pdv of pdvs) {
        const distance = await this.getDistanceFromOSRM(
          cepLat,
          cepLng,
          parseFloat(pdv.latitude),
          parseFloat(pdv.longitude),
        );

        if (distance <= 50000) {
          nearbyStores.push({
            name: pdv.storeName,
            city: pdv.city,
            postalCode: pdv.postalCode,
            type: 'PDV',
            distance: `${(distance / 1000).toFixed(1)} km`,
            value: [
              {
                prazo: `${pdv.shippingTimeInDays} dias úteis`,
                price: 'R$ 15,00',
                description: 'Motoboy',
              },
            ],
          });
        }

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestPdv = pdv;
        }
      }

      const onlineStore = await this.storeRepository.findOne({ where: { type: 'LOJA' } });
      if (onlineStore) {
        const onlineStoreDistance = await this.getDistanceFromOSRM(
          cepLat,
          cepLng,
          parseFloat(onlineStore.latitude),
          parseFloat(onlineStore.longitude),
        );

        const formattedCep = this.formatCep(cep);
        const nearestPdvCep = nearestPdv?.postalCode 
          ? this.formatCep(nearestPdv.postalCode) 
          : '49030-600';

        const freight = await this.calculateFreight(formattedCep, nearestPdvCep);

        if (Array.isArray(freight)) {
          nearbyStores.push({
            name: onlineStore.storeName,
            city: onlineStore.city,
            postalCode: onlineStore.postalCode,
            type: 'LOJA',
            distance: `${(onlineStoreDistance / 1000).toFixed(1)} km`,
            value: freight.map((f: any) => ({
              id: f.id,
              name: f.name,
              price: f.price ? `R$ ${parseFloat(f.price).toFixed(2)}` : 'Preço não disponível',
              company: f.company?.name || 'Empresa não disponível',
              delivery_time: f.delivery_time ? `${f.delivery_time} dias úteis` : 'N/A dias úteis',
              codProdutoAgencia: f.product_code || 'N/A',
              description:
                f.name.toLowerCase() === 'pac'
                  ? 'PAC é a encomenda econômica dos Correios'
                  : f.name.toLowerCase() === 'sedex'
                  ? 'SEDEX é a encomenda expressa dos Correios'
                  : 'Descrição não disponível',
            })),
          });
        } else {
          console.error('Freight response is not valid:', freight);
          throw new Error('O cálculo de frete retornou um formato inesperado.');
        }
      }

      const pins = pdvs.map((pdv) => ({
        position: {
          lat: parseFloat(pdv.latitude),
          lng: parseFloat(pdv.longitude),
        },
        title: pdv.storeName,
      }));

      const paginatedStores = nearbyStores.slice(offset, offset + limit);

      return {
        stores: paginatedStores,
        pins,
        limit,
        offset,
        total: nearbyStores.length,
      };
    } catch (error) {
      console.error('Erro ao processar busca por CEP:', error.message);
      throw error;
    }
  }

  async findByState(state: string, limit: number = 10, offset: number = 0) {
    const [stores, total] = await this.storeRepository.findAndCount({
      where: { state },
      skip: offset,
      take: limit,
    });

    return {
      stores,
      limit,
      offset,
      total,
    };
  }

  async createStoreWithAddress(storeData: Partial<Store>) {
    if (storeData.type === 'PDV' && !storeData.postalCode) {
      throw new Error('O campo postalCode é obrigatório para lojas do tipo PDV.');
    }

    let cepInfo: CepInfo | null = null;
    if (storeData.postalCode) {
      try {
        const cepNumbers = storeData.postalCode.replace(/\D/g, '');
        cepInfo = await this.cepService.getCepInfo(cepNumbers);
      } catch (error) {
        throw new Error('Não foi possível buscar informações do CEP. Verifique se o CEP é válido.');
      }
    }

    if (!storeData.postalCode) {
      throw new Error('O campo postalCode é obrigatório para obter as coordenadas.');
    }

    const cepNumbers = storeData.postalCode.replace(/\D/g, '');
    const { latitude, longitude } = await this.cepService.getCoordinatesFromCep(cepNumbers);

    if (!latitude || !longitude) {
      throw new Error('Não foi possível obter as coordenadas para o CEP fornecido.');
    }

    // Formatar o CEP para armazenamento
    const formattedCep = this.formatCep(storeData.postalCode);
    
    const newStore = this.storeRepository.create({
      ...storeData,
      postalCode: formattedCep,
      address1: cepInfo?.logradouro || 'Endereço não informado',
      address2: storeData.address2 || '',
      address3: storeData.address3 || '',
      city: cepInfo?.localidade || 'Cidade não informada',
      district: cepInfo?.bairro || 'Bairro não informado',
      state: cepInfo?.uf || 'Estado não informado',
      country: 'Brasil',
      latitude: latitude.toString(),
      longitude: longitude.toString(),
    });

    return this.storeRepository.save(newStore);
  }

  async updateStore(id: string, updateData: Partial<Store>) {
    const store = await this.storeRepository.findOne({ where: { storeID: id } });
    
    if (!store) {
      throw new Error('Store not found');
    }
    
    if (updateData.postalCode && updateData.postalCode !== store.postalCode) {
      try {
        const cepNumbers = updateData.postalCode.replace(/\D/g, '');
        const cepInfo = await this.cepService.getCepInfo(cepNumbers);
        const { latitude, longitude } = await this.cepService.getCoordinatesFromCep(cepNumbers);
        
        if (!latitude || !longitude) {
          throw new Error('Não foi possível obter as coordenadas para o CEP fornecido.');
        }
        
        const formattedCep = this.formatCep(updateData.postalCode);
        
        updateData = {
          ...updateData,
          postalCode: formattedCep,
          address1: cepInfo?.logradouro || store.address1,
          city: cepInfo?.localidade || store.city,
          district: cepInfo?.bairro || store.district,
          state: cepInfo?.uf || store.state,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        };
      } catch (error) {
        throw new Error('Não foi possível atualizar o CEP. Verifique se o CEP é válido.');
      }
    }
    
    await this.storeRepository.update({ storeID: id }, updateData);
    
    return this.findById(id);
  }

  async deleteStore(id: string) {
    const store = await this.storeRepository.findOne({ where: { storeID: id } });
    
    if (!store) {
      throw new Error('Store not found');
    }
    
    await this.storeRepository.delete({ storeID: id });
    
    return {
      success: true,
      message: `Loja ${store.storeName} excluída com sucesso`,
      deletedId: id
    };
  }

  private async getDistanceFromOSRM(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): Promise<number> {
    const url = `http://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;

    const response = await lastValueFrom(this.httpService.get(url));
    const routes = response.data.routes;

    if (routes && routes.length > 0) {
      return routes[0].distance;
    }

    throw new Error('Não foi possível calcular a distância.');
  }

  public async calculateFreight(destinationCep: string, originCep: string) {
    try {
      // Validar CEPs
      if (!destinationCep || !originCep) {
        throw new Error('CEPs de origem e destino são obrigatórios');
      }
      
      try {
        destinationCep = this.formatCep(destinationCep);
        originCep = this.formatCep(originCep);
      } catch (error) {
        throw new Error('Formato de CEP inválido. O CEP deve conter 8 dígitos.');
      }

      const payload = {
        from: { postal_code: originCep },
        to: { postal_code: destinationCep },
        products: [
          {
            id: '1',
            width: 15,
            height: 10,
            length: 20,
            weight: 1,
            insurance_value: 0,
            quantity: 1,
          },
        ],
        options: {
          receipt: false,
          own_hand: false,
          insurance_value: 0,
          reverse: false,
          non_commercial: true,
        },
        services: ['1', '2'],
        validate: true,
      };

      if (!process.env.MELHOR_ENVIO_TOKEN) {
        throw new Error('Token do Melhor Envio não configurado');
      }

      const response = await lastValueFrom(
        this.httpService.post(
          'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
          payload,
          {
            headers: {
              Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Physical-Store_02/1.0',
            },
          },
        ),
      );

      if (!response.data || !Array.isArray(response.data)) {
        console.error('Resposta inesperada da API Melhor Envio:', response.data);
        throw new Error('Formato de resposta inválido da API de frete');
      }

      const filteredServices = response.data.filter((service: any) =>
        service.name.toLowerCase() === 'pac' || service.name.toLowerCase() === 'sedex',
      );

      console.log('Filtered Freight Response:', filteredServices);

      return filteredServices;
    } catch (error) {
      console.error('Erro ao calcular o frete:', error.message);
      
      if (error.message === 'Token do Melhor Envio não configurado') {
        throw new Error('Erro de configuração do serviço de frete. Entre em contato com o suporte.');
      }
      
      if (error.message.includes('Formato de CEP inválido') || 
          error.message.includes('CEP inválido')) {
        throw new Error(error.message);
      }
      
      throw new Error('Não foi possível calcular o frete. Tente novamente.');
    }
  }
}