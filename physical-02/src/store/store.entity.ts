import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class Store {
  @ApiProperty({ description: 'ID da loja', example: '123e4567-e89b-12d3-a456-426614174000' })
  @PrimaryGeneratedColumn('uuid')
  storeID: string;

  @ApiProperty({ description: 'Nome da loja', example: 'Loja Centro' })
  @Column()
  storeName: string;

  @ApiProperty({ description: 'Se permite retirada na loja', example: true })
  @Column()
  takeOutInStore: boolean;

  @ApiProperty({ description: 'Tempo de entrega em dias', example: 2 })
  @Column()
  shippingTimeInDays: number;

  @ApiProperty({ description: 'Latitude', example: '-23.55052' })
  @Column()
  latitude: string;

  @ApiProperty({ description: 'Longitude', example: '-46.633308' })
  @Column()
  longitude: string;

  @ApiProperty({ description: 'Endereço (linha 1)', example: 'Praça da Sé, 123' })
  @Column()
  address1: string;

  @ApiProperty({ description: 'Endereço (linha 2)', example: 'Andar 10', nullable: true })
  @Column({ nullable: true })
  address2: string;

  @ApiProperty({ description: 'Endereço (linha 3)', example: 'Sala 1001', nullable: true })
  @Column({ nullable: true })
  address3: string;

  @ApiProperty({ description: 'Cidade', example: 'São Paulo' })
  @Column()
  city: string;

  @ApiProperty({ description: 'Bairro', example: 'Centro' })
  @Column()
  district: string;

  @ApiProperty({ description: 'Estado (UF)', example: 'SP' })
  @Column()
  state: string;

  @ApiProperty({ description: 'Tipo da loja', example: 'PDV', enum: ['PDV', 'LOJA'] })
  @Column()
  type: string; // PDV | LOJA

  @ApiProperty({ description: 'País', example: 'Brasil' })
  @Column()
  country: string;

  @ApiProperty({ description: 'CEP', example: '01001-000' })
  @Column()
  postalCode: string;

  @ApiProperty({ description: 'Telefone', example: '11999999999' })
  @Column()
  telephoneNumber: string;

  @ApiProperty({ description: 'Email', example: 'contato@loja.com' })
  @Column()
  emailAddress: string;
}