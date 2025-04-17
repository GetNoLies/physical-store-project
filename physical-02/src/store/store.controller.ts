import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { StoreService } from './store.service';
import { Store } from './store.entity';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  listAll(@Query('limit') limit: number = 10, @Query('offset') offset: number = 0) {
    return this.storeService.listAll(limit, offset);
  }

  @Get(':id')
  storeById(@Param('id') id: string) {
    return this.storeService.findById(id);
  }

  @Get('by-cep/:cep')
  storeByCep(@Param('cep') cep: string, @Query('limit') limit: number = 10, @Query('offset') offset: number = 0) {
    return this.storeService.findByCep(cep, limit, offset);
  }

  @Get('by-state/:state')
  storeByState(@Param('state') state: string, @Query('limit') limit: number = 10, @Query('offset') offset: number = 0) {
    return this.storeService.findByState(state, limit, offset);
  }

  @Post()
  async createStore(@Body() storeData: Partial<Store>) {
    return this.storeService.createStoreWithAddress(storeData);
  }
}