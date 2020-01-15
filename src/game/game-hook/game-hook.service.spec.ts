import { Test, TestingModule } from '@nestjs/testing';
import { GameHookService } from './game-hook.service';

describe('GameHookService', () => {
  let service: GameHookService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameHookService],
    }).compile();

    service = module.get<GameHookService>(GameHookService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
