import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { StoreService } from './store.service';
import { Store } from './store.entity';
import { 
  CreateStoreDto, 
  StoreResponseDto, 
  CepStoreResponseDto, 
  UpdateStoreDto,
  DeleteResponseDto
} from './dto/store.dto';

@ApiTags('stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as lojas', description: 'Recupera todas as lojas com paginação' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Deslocamento (para paginação)' })
  @ApiResponse({ status: 200, description: 'Lista de lojas retornada com sucesso', type: StoreResponseDto })
  listAll(@Query('limit') limit: number = 10, @Query('offset') offset: number = 0) {
    return this.storeService.listAll(limit, offset);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar loja por ID', description: 'Recupera uma loja específica pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da loja' })
  @ApiResponse({ status: 200, description: 'Loja encontrada com sucesso', type: StoreResponseDto })
  @ApiResponse({ status: 404, description: 'Loja não encontrada' })
  storeById(@Param('id') id: string) {
    return this.storeService.findById(id);
  }

  @Get('by-cep/:cep')
  @ApiOperation({ 
    summary: 'Buscar lojas por CEP', 
    description: 'Recupera lojas próximas ao CEP informado, incluindo PDVs para entrega local e opções de frete' 
  })
  @ApiParam({ name: 'cep', description: 'CEP para busca (formato: 00000-000)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Deslocamento (para paginação)' })
  @ApiResponse({ status: 200, description: 'Lojas encontradas com sucesso', type: CepStoreResponseDto })
  @ApiResponse({ status: 400, description: 'CEP inválido ou não encontrado' })
  storeByCep(@Param('cep') cep: string, @Query('limit') limit: number = 10, @Query('offset') offset: number = 0) {
    return this.storeService.findByCep(cep, limit, offset);
  }

  @Get('by-state/:state')
  @ApiOperation({ summary: 'Buscar lojas por estado', description: 'Recupera lojas filtradas pelo estado (UF)' })
  @ApiParam({ name: 'state', description: 'Sigla do estado (UF)', example: 'SP' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de resultados' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Deslocamento (para paginação)' })
  @ApiResponse({ status: 200, description: 'Lojas encontradas com sucesso', type: StoreResponseDto })
  storeByState(@Param('state') state: string, @Query('limit') limit: number = 10, @Query('offset') offset: number = 0) {
    return this.storeService.findByState(state, limit, offset);
  }

  @Post()
  @ApiOperation({ summary: 'Criar nova loja', description: 'Cadastra uma nova loja com obtenção automática de endereço pelo CEP' })
  @ApiResponse({ status: 201, description: 'Loja criada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async createStore(@Body() storeData: CreateStoreDto) {
    return this.storeService.createStoreWithAddress(storeData);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar loja existente', description: 'Atualiza os dados de uma loja existente' })
  @ApiParam({ name: 'id', description: 'ID da loja' })
  @ApiResponse({ status: 200, description: 'Loja atualizada com sucesso', type: StoreResponseDto })
  @ApiResponse({ status: 404, description: 'Loja não encontrada' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async updateStore(@Param('id') id: string, @Body() updateData: UpdateStoreDto) {
    return this.storeService.updateStore(id, updateData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Excluir loja', description: 'Remove uma loja existente do banco de dados' })
  @ApiParam({ name: 'id', description: 'ID da loja a ser excluída' })
  @ApiResponse({ status: 200, description: 'Loja excluída com sucesso', type: DeleteResponseDto })
  @ApiResponse({ status: 404, description: 'Loja não encontrada' })
  async deleteStore(@Param('id') id: string) {
    return this.storeService.deleteStore(id);
  }
}