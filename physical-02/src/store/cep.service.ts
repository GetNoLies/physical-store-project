import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

export interface CepInfo {
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

@Injectable()
export class CepService {
  constructor(private readonly httpService: HttpService) {}

  async getCepInfo(cep: string): Promise<CepInfo> {
    if (!/^\d{8}$/.test(cep)) {
      throw new Error('O CEP fornecido é inválido. Certifique-se de que ele contém 8 dígitos.');
    }

    const response = await lastValueFrom(
      this.httpService.get(`https://viacep.com.br/ws/${cep}/json/`, {
        timeout: 5000,
      }),
    );

    if (response.data.erro) {
      throw new Error('CEP inválido ou não encontrado.');
    }

    return response.data;
  }

  async getCoordinatesFromCep(cep: string): Promise<{ latitude: number; longitude: number }> {
    // Validação do formato do CEP
    if (!/^\d{8}$/.test(cep)) {
      throw new Error('O CEP fornecido é inválido. Certifique-se de que ele contém 8 dígitos.');
    }

    console.log(`Buscando coordenadas para o CEP: ${cep}`);

    const response = await lastValueFrom(
      this.httpService.get(`https://nominatim.openstreetmap.org/search`, {
        params: {
          q: cep,
          format: 'json',
          addressdetails: 1,
          limit: 1,
        },
        timeout: 5000,
      }),
    );

    if (response.data.length === 0) {
      throw new Error('Não foi possível obter as coordenadas para o CEP fornecido.');
    }

    const { lat, lon } = response.data[0];
    return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
  }
}