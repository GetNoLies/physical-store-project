import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface CepInfo {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean; // Campo opcional para indicar erro
}

@Injectable()
export class CepService {
  constructor(private readonly httpService: HttpService) {}

  async getCepInfo(cep: string): Promise<CepInfo> {
    const response = await lastValueFrom(
      this.httpService.get(`https://viacep.com.br/ws/${cep}/json/`),
    );

    if (response.data.erro) {
      throw new Error('CEP inválido ou não encontrado.');
    }

    return response.data;
  }
}