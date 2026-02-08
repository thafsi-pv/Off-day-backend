import { Test, TestingModule } from '@nestjs/testing';
import { UserShiftsController } from './user-shifts.controller';

describe('UserShiftsController', () => {
  let controller: UserShiftsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserShiftsController],
    }).compile();

    controller = module.get<UserShiftsController>(UserShiftsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
