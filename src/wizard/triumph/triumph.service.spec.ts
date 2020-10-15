import { Test, TestingModule } from '@nestjs/testing';
import { TriumphService } from './triumph.service';

describe('TriumphService', () => {
  let service: TriumphService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TriumphService],
    }).compile();

    service = module.get<TriumphService>(TriumphService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
