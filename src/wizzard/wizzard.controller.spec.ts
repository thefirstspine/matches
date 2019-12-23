import { Test, TestingModule } from '@nestjs/testing';
import { WizzardController } from './wizzard.controller';

describe('Wizzard Controller', () => {
  let controller: WizzardController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WizzardController],
    }).compile();

    controller = module.get<WizzardController>(WizzardController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
