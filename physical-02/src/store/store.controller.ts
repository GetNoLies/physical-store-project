import { Controller, Get, Param, Query } from '@nestjs/common';
import { StoreService } from './store.service';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  listAll() {
    return this.storeService.findAll();
  }

  @Get(':id')
  storeById(@Param('id') id: string) {
    return this.storeService.findById(id);
  }

  @Get('by-cep/:cep')
  storeByCep(@Param('cep') cep: string) {
    return this.storeService.findByCep(cep);
  }

  @Get('by-state')
  storeByState(@Query('state') state: string) {
    return this.storeService.findByState(state);
  }
}