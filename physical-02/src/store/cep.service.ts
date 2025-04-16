import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class CepService {
  constructor(private readonly httpService: HttpService) {}

  async getCepInfo(cep: string) {
    const response = await lastValueFrom(
      this.httpService.get(`https://viacep.com.br/ws/${cep}/json/`),
    );
    return response.data;
  }
}