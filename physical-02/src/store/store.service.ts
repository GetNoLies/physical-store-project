import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { CepService } from './cep.service';
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
    const cepInfo = await this.cepService.getCepInfo(cep);
    const { latitude: cepLat, longitude: cepLng } = cepInfo;

    const stores = await this.storeRepository.find();

    const nearbyStores: { store: Store; distance: number }[] = [];
    for (const store of stores) {
      const distance = await this.getDistanceFromOSRM(
        cepLat,
        cepLng,
        parseFloat(store.latitude),
        parseFloat(store.longitude),
      );

      if (distance <= 50000) {
        nearbyStores.push({
          store,
          distance: distance / 1000,
        });
      }
    }

    if (nearbyStores.length > 0) {
      return nearbyStores.map((nearbyStore) => ({
        store: nearbyStore.store,
        distance: nearbyStore.distance,
        shippingCost: 15,
        shippingTime: nearbyStore.store.shippingTimeInDays,
      }));
    } else {
      const freight = await this.calculateFreight(cep);
      return {
        message: 'Nenhuma loja próxima encontrada. Será entregue pela Loja Online.',
        freight,
      };
    }
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
      return routes[0].distance;
    }

    throw new Error('Não foi possível calcular a distância.');
  }

  private async calculateFreight(cep: string) {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
        {
          from: { postal_code: '01001000' },
          to: { postal_code: cep },
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