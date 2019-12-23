import { Test, TestingModule } from '@nestjs/testing';
import { WizzardsStorageService } from './wizzards.storage.service';

describe('WizzardsStorageService', () => {
  let service: WizzardsStorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WizzardsStorageService],
    }).compile();

    service = module.get<WizzardsStorageService>(WizzardsStorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
