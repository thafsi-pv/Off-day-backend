import { Module } from '@nestjs/common';
import { LeavesService } from './leaves.service';
import { LeavesController } from './leaves.controller';


@Module({
  imports: [],
  controllers: [LeavesController],
  providers: [LeavesService],
})
export class LeavesModule { }
