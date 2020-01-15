import { Test, TestingModule } from '@nestjs/testing';
import { GameWorkerService } from './game-worker.service';

describe('GameWorkerService', () => {
  let service: GameWorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameWorkerService],
    }).compile();

    service = module.get<GameWorkerService>(GameWorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
