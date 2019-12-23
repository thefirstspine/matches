import { Test, TestingModule } from '@nestjs/testing';
import { GamesStorageService } from './games.storage.service';

describe('GamesStorageService', () => {
  let service: GamesStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GamesStorageService],
    }).compile();

    service = module.get<GamesStorageService>(GamesStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
