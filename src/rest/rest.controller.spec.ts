import { Test, TestingModule } from '@nestjs/testing';
import { RestController } from './rest.controller';

describe('Rest Controller', () => {
  let controller: RestController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RestController],
    }).compile();

    controller = module.get<RestController>(RestController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
