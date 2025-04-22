import { ApiProperty } from '@nestjs/swagger';

export class CreateStoreDto {
  @ApiProperty({ description: 'Nome da loja', example: 'Loja Centro' })
  storeName: string;

  @ApiProperty({ description: 'CEP da loja', example: '01001-000' })
  postalCode: string;

  @ApiProperty({
    description: 'Tipo da loja (PDV ou LOJA)',
    example: 'PDV',
    enum: ['PDV', 'LOJA']
  })
  type: string;

  @ApiProperty({ description: 'Se permite retirada na loja', example: true, required: false })
  takeOutInStore?: boolean;

  @ApiProperty({ description: 'Tempo de entrega em dias', example: 2, required: false })
  shippingTimeInDays?: number;

  @ApiProperty({ description: 'Telefone da loja', example: '11999999999', required: false })
  telephoneNumber?: string;

  @ApiProperty({ description: 'Email da loja', example: 'loja@exemplo.com', required: false })
  emailAddress?: string;
}

export class StoreResponseDto {
  @ApiProperty({ description: 'Lista de lojas encontradas', type: 'array' })
  stores: any[];

  @ApiProperty({ description: 'Limite de resultados por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Deslocamento (para paginação)', example: 0 })
  offset: number;

  @ApiProperty({ description: 'Total de registros encontrados', example: 100 })
  total: number;
}

export class CepStoreResponseDto {
  @ApiProperty({ description: 'Lista de lojas encontradas', type: 'array' })
  stores: any[];

  @ApiProperty({ description: 'Pins para visualização no mapa', type: 'array' })
  pins: {
    position: {
      lat: number;
      lng: number;
    };
    title: string;
  }[];

  @ApiProperty({ description: 'Limite de resultados por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Deslocamento (para paginação)', example: 0 })
  offset: number;

  @ApiProperty({ description: 'Total de registros encontrados', example: 100 })
  total: number;
}

export class FreightResponseDto {
  @ApiProperty({ example: '1', description: 'ID do serviço' })
  id: string;

  @ApiProperty({ example: 'PAC', description: 'Nome do serviço' })
  name: string;

  @ApiProperty({ example: '23.45', description: 'Valor do frete' })
  price: string;

  @ApiProperty({ 
    description: 'Empresa transportadora',
    example: { name: 'Correios' }
  })
  company: { name: string };

  @ApiProperty({
    description: 'Tempo de entrega',
    example: { days: 5, working_days: true }
  })
  delivery_time: {
    days: number;
    working_days: boolean;
  };
}

export class UpdateStoreDto {
  @ApiProperty({ description: 'Nome da loja', example: 'Loja Centro', required: false })
  storeName?: string;

  @ApiProperty({ description: 'CEP da loja', example: '01001-000', required: false })
  postalCode?: string;

  @ApiProperty({ description: 'Telefone da loja', example: '11999999999', required: false })
  telephoneNumber?: string;

  @ApiProperty({ description: 'Email da loja', example: 'loja@exemplo.com', required: false })
  emailAddress?: string;

  @ApiProperty({ description: 'Tempo de entrega em dias', example: 2, required: false })
  shippingTimeInDays?: number;
}

export class DeleteResponseDto {
  @ApiProperty({ example: true, description: 'Status da operação' })
  success: boolean;

  @ApiProperty({ example: 'Loja Exemplo excluída com sucesso', description: 'Mensagem de confirmação' })
  message: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ID da loja excluída' })
  deletedId: string;
}