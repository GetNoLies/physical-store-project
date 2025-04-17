import { Test, TestingModule } from '@nestjs/testing';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Store } from './store.entity';
import { CepService } from './cep.service';
import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';

describe('StoreController', () => {
  let controller: StoreController;
  let service: StoreService;

  const createMockStore = (overrides = {}): Store => ({
    storeID: '1',
    storeName: 'Store 1',
    takeOutInStore: false,
    shippingTimeInDays: 1,
    latitude: '-23.55',
    longitude: '-46.63',
    address1: 'Address 1',
    address2: '',
    address3: '',
    city: 'São Paulo',
    district: 'Centro',
    state: 'SP',
    country: 'Brasil',
    postalCode: '01001-000',
    telephoneNumber: '11999999999',
    emailAddress: 'store@example.com',
    type: 'PDV',
    ...overrides
  } as Store);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoreController],
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

    controller = module.get<StoreController>(StoreController);
    service = module.get<StoreService>(StoreService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listAll', () => {
    it('should return all stores', async () => {
      const mockResult = {
        stores: [createMockStore()],
        limit: 10,
        offset: 0,
        total: 1,
      };

      jest.spyOn(service, 'listAll').mockResolvedValue(mockResult);

      expect(await controller.listAll(10, 0)).toBe(mockResult);
      expect(service.listAll).toHaveBeenCalledWith(10, 0);
    });

    it('should handle errors', async () => {
      jest.spyOn(service, 'listAll').mockRejectedValue(new Error('Database error'));
      
      await expect(controller.listAll(10, 0)).rejects.toThrow();
    });
  });

  describe('storeById', () => {
    it('should return store by id', async () => {
      const mockResult = {
        stores: [createMockStore()],
        limit: 1,
        offset: 0,
        total: 1,
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockResult);

      expect(await controller.storeById('1')).toBe(mockResult);
      expect(service.findById).toHaveBeenCalledWith('1');
    });

    it('should handle errors when store is not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValue(new Error('Store not found'));
      
      await expect(controller.storeById('999')).rejects.toThrow('Store not found');
    });
  });

  describe('storeByCep', () => {
    it('should return stores by CEP', async () => {
      const mockResult = {
        stores: [
          {
            name: 'Store 1',
            city: 'São Paulo',
            distance: '1.0 km',
          },
        ],
        pins: [{ position: { lat: -23.55052, lng: -46.633308 }, title: 'Store 1' }],
        limit: 10,
        offset: 0,
        total: 1,
      };

      jest.spyOn(service, 'findByCep').mockResolvedValue(mockResult);

      expect(await controller.storeByCep('01001-000', 10, 0)).toBe(mockResult);
      expect(service.findByCep).toHaveBeenCalledWith('01001-000', 10, 0);
    });

    it('should handle invalid CEP', async () => {
      jest.spyOn(service, 'findByCep').mockRejectedValue(new Error('Invalid CEP'));
      
      await expect(controller.storeByCep('invalid-cep', 10, 0)).rejects.toThrow();
    });
  });

  describe('storeByState', () => {
    it('should return stores by state', async () => {
      const mockResult = {
        stores: [createMockStore({ state: 'SP' })],
        limit: 10,
        offset: 0,
        total: 1,
      };

      jest.spyOn(service, 'findByState').mockResolvedValue(mockResult);

      expect(await controller.storeByState('SP', 10, 0)).toBe(mockResult);
      expect(service.findByState).toHaveBeenCalledWith('SP', 10, 0);
    });
  });

  describe('createStore', () => {
    it('should create a new store', async () => {
      const storeData = {
        storeName: 'New Store',
        postalCode: '01001-000',
        type: 'PDV',
      };

      const mockResult = createMockStore({
        storeID: '1',
        storeName: 'New Store',
        postalCode: '01001-000',
        type: 'PDV',
      });

      jest.spyOn(service, 'createStoreWithAddress').mockResolvedValue(mockResult);

      expect(await controller.createStore(storeData as Partial<Store>)).toBe(mockResult);
      expect(service.createStoreWithAddress).toHaveBeenCalledWith(storeData);
    });

    it('should handle errors during store creation', async () => {
      const storeData = {
        storeName: 'New Store',
        type: 'PDV',
      };

      jest.spyOn(service, 'createStoreWithAddress').mockRejectedValue(
        new Error('O campo postalCode é obrigatório para lojas do tipo PDV.')
      );
      
      await expect(controller.createStore(storeData as Partial<Store>)).rejects.toThrow(
        'O campo postalCode é obrigatório para lojas do tipo PDV.'
      );
    });
  });
});