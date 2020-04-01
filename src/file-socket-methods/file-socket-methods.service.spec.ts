import { Test, TestingModule } from '@nestjs/testing';
import { FileSocketMethodsService } from './file-socket-methods.service';

describe('FileSocketMethodsService', () => {
  let service: FileSocketMethodsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileSocketMethodsService],
    }).compile();

    service = module.get<FileSocketMethodsService>(FileSocketMethodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
