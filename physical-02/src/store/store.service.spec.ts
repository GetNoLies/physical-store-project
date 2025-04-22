import { Test, TestingModule } from '@nestjs/testing';
import { StoreService } from './store.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { CepService } from './cep.service';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { of, throwError } from 'rxjs';
import { AxiosResponse, AxiosHeaders } from 'axios';

describe('StoreService', () => {
  let service: StoreService;
  let repository: Repository<Store>;
  let cepService: CepService;
  let httpService: HttpService;
  
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = {
      ...originalEnv,
      MELHOR_ENVIO_TOKEN: 'test-token',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreService,
        {
          provide: getRepositoryToken(Store),
          useClass: Repository,
        },
        {
          provide: CepService,
          useValue: {
            getCoordinatesFromCep: jest.fn(),
            getCepInfo: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StoreService>(StoreService);
    repository = module.get<Repository<Store>>(getRepositoryToken(Store));
    cepService = module.get<CepService>(CepService);
    httpService = module.get<HttpService>(HttpService);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('calculateFreight', () => {
    it('should calculate freight using Melhor Envio API', async () => {
      const mockResponse: AxiosResponse = {
        data: [
          { id: '1', name: 'PAC', price: '23.45' },
          { id: '2', name: 'SEDEX', price: '34.20' },
        ],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders()
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.calculateFreight('01001-000', '20040-030');

      expect(result).toEqual([
        { id: '1', name: 'PAC', price: '23.45' },
        { id: '2', name: 'SEDEX', price: '34.20' },
      ]);
      expect(httpService.post).toHaveBeenCalledWith(
        'https://melhorenvio.com.br/api/v2/me/shipment/calculate',
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should throw an error if API call fails', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(throwError(() => new Error('API Error')));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(service.calculateFreight('01001-000', '20040-030')).rejects.toThrow(
        'Não foi possível calcular o frete. Tente novamente.'
      );

      consoleSpy.mockRestore();
    });

    it('should handle empty response from API', async () => {
      const mockResponse: AxiosResponse = {
        data: [],
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders()
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.calculateFreight('01001-000', '20040-030');
      expect(result).toEqual([]);
    });

    it('should throw specific error for missing token', async () => {
      process.env.MELHOR_ENVIO_TOKEN = '';
      
      await expect(service.calculateFreight('01001-000', '20040-030')).rejects.toThrow(
        'Erro de configuração do serviço de frete. Entre em contato com o suporte.'
      );
    });
  });

  describe('getDistanceFromOSRM', () => {
    it('should calculate distance between coordinates', async () => {
      const mockResponse: AxiosResponse = {
        data: {
          routes: [{ distance: 1000 }]
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders()
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      const result = await (service as any).getDistanceFromOSRM(-23.55, -46.63, -23.53, -46.62);

      expect(result).toBe(1000);
      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('router.project-osrm.org/route/v1/driving/')
      );
    });

    it('should throw error if no routes available', async () => {
      const mockResponse: AxiosResponse = {
        data: { routes: [] },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {
          headers: new AxiosHeaders()
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse));

      await expect((service as any).getDistanceFromOSRM(-23.55, -46.63, -23.53, -46.62)).rejects.toThrow(
        'Não foi possível calcular a distância.'
      );
    });
  });
});