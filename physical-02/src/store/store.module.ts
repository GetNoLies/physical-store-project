import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StoreService } from './store.service';
import { StoreController } from './store.controller';
import { Store } from './store.entity';
import { CepService } from './cep.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Store]),
    HttpModule,
  ],
  controllers: [StoreController],
  providers: [StoreService, CepService],
})
export class StoreModule {}