import { Test, TestingModule } from '@nestjs/testing';
import { WizzardService } from './wizzard.service';

describe('WizzardService', () => {
  let service: WizzardService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WizzardService],
    }).compile();

    service = module.get<WizzardService>(WizzardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
