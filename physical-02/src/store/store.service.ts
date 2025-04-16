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

  findAll() {
    return this.storeRepository.find();
  }

  findById(id: string) {
    return this.storeRepository.findOne({ where: { storeID: id } });
  }

  async findByCep(cep: string) {
    // Buscar informações do CEP
    const cepInfo = await this.cepService.getCepInfo(cep);

    // Buscar apenas lojas do tipo PDV
    const pdvs = await this.storeRepository.find({ where: { type: 'PDV' } });

    let nearestPdv: Store | null = null;
    let nearestDistance = Infinity;

    const nearbyStores: any[] = [];
    for (const pdv of pdvs) {
      // Calcular a distância entre o CEP fornecido e o PDV usando a API OSRM
      const distance = await this.getDistanceFromOSRM(
        parseFloat(pdv.latitude),
        parseFloat(pdv.longitude),
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

      // Identificar o PDV mais próximo
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPdv = pdv;
      }
    }

    // Caso não haja PDVs próximos, calcular frete com base na loja online (LOJA)
    const onlineStore = await this.storeRepository.findOne({ where: { type: 'LOJA' } });
    if (onlineStore) {
      const freight = await this.calculateFreight(cep, nearestPdv?.postalCode || '01001000'); // Usar o CEP do PDV mais próximo ou um CEP padrão
      nearbyStores.push({
        name: onlineStore.storeName,
        city: onlineStore.city,
        postalCode: onlineStore.postalCode,
        type: 'LOJA',
        distance: 'N/A', // Distância não calculada para lojas online
        value: freight.map((f: any) => ({
          prazo: `${f.delivery_time} dias úteis`,
          codProdutoAgencia: f.product_code,
          price: `R$ ${f.price.toFixed(2)}`,
          description: f.description,
        })),
      });
    }

    // Criar pins para o mapa
    const pins = pdvs.map((pdv) => ({
      position: {
        lat: parseFloat(pdv.latitude),
        lng: parseFloat(pdv.longitude),
      },
      title: pdv.storeName,
    }));

    return {
      stores: nearbyStores,
      pins,
    };
  }

  async createStoreWithAddress(storeData: Partial<Store>) {
    // Verificar se o tipo é PDV e se o postalCode está definido
    if (storeData.type === 'PDV' && !storeData.postalCode) {
      throw new Error('O campo postalCode é obrigatório para lojas do tipo PDV.');
    }

    // Buscar informações do endereço com base no CEP, se o postalCode estiver definido
    let cepInfo: CepInfo | null = null;
    if (storeData.postalCode) {
      try {
        cepInfo = await this.cepService.getCepInfo(storeData.postalCode);
      } catch (error) {
        throw new Error('Não foi possível buscar informações do CEP. Verifique se o CEP é válido.');
      }
    }

    // Preencher os campos de endereço automaticamente, com valores padrão para evitar erros
    const newStore = this.storeRepository.create({
      ...storeData,
      address1: cepInfo?.logradouro || 'Endereço não informado',
      address2: storeData.address2 || '', // Complemento opcional
      address3: cepInfo?.bairro || 'Bairro não informado',
      city: cepInfo?.localidade || 'Cidade não informada',
      state: cepInfo?.uf || 'Estado não informado',
      country: 'Brasil', // País fixo
    });

    // Salvar a loja no banco de dados
    return this.storeRepository.save(newStore);
  }

  findByState(state: string) {
    return this.storeRepository.find({ where: { state } });
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
      return routes[0].distance; // Distância em metros
    }

    throw new Error('Não foi possível calcular a distância.');
  }

  private async calculateFreight(destinationCep: string, originCep: string) {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
        {
          from: { postal_code: originCep },
          to: { postal_code: destinationCep },
          products: [{ weight: 1, width: 10, height: 10, length: 10, quantity: 1 }],
          services: '1',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }
}