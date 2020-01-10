import { Test, TestingModule } from '@nestjs/testing';
import { ArenaRoomsService } from './arena-rooms.service';

describe('ArenaRoomsService', () => {
  let service: ArenaRoomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ArenaRoomsService],
    }).compile();

    service = module.get<ArenaRoomsService>(ArenaRoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
