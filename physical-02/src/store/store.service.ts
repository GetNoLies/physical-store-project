import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Store } from './store.entity';

@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(Store)
    private readonly storeRepository: Repository<Store>,
  ) {}

  findAll() {
    return this.storeRepository.find();
  }

  findById(id: string) {
    return this.storeRepository.findOne({ where: { storeID: id } });
  }

  async findByCep(cep: string) {
    // Aqui você pode integrar com a API ViaCEP para buscar a localização do CEP
    // e calcular a proximidade com as lojas.
    // Por enquanto, retornaremos um mock.
    return this.storeRepository.find(); // Substituir com lógica real
  }

  findByState(state: string) {
    return this.storeRepository.find({ where: { state } });
  }
}