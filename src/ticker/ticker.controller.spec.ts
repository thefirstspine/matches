import { Test, TestingModule } from '@nestjs/testing';
import { TickerController } from './ticker.controller';

describe('Ticker Controller', () => {
  let controller: TickerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TickerController],
    }).compile();

    controller = module.get<TickerController>(TickerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
