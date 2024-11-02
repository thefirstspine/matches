import { Test, TestingModule } from '@nestjs/testing';
import { IndexController } from './index.controller';
import { GameService } from '../game/game.service';

describe('Index Controller', () => {
  let controller: IndexController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndexController],
      providers: [GameService],
    }).compile();

    controller = module.get<IndexController>(IndexController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
