import { Test, TestingModule } from '@nestjs/testing';
import { UserShiftsService } from './user-shifts.service';

describe('UserShiftsService', () => {
  let service: UserShiftsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserShiftsService],
    }).compile();

    service = module.get<UserShiftsService>(UserShiftsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
