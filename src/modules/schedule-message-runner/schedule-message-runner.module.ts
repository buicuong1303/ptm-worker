import { ScheduleMessageQueueModule } from './../queues/modules/schedule-message-queue/schedule-message-queue.module';
import { Module, forwardRef } from '@nestjs/common';
import { ScheduleMessageRunnerService } from './schedule-message-runner.service';
import { SchedulerModule } from '../scheduler/scheduler.module';

@Module({
  imports: [
    forwardRef(() => SchedulerModule),
    forwardRef(() => ScheduleMessageQueueModule),
  ],
  providers: [ScheduleMessageRunnerService],
  exports: [ScheduleMessageRunnerService],
})
export class ScheduleMessageRunnerModule {}
