import { forwardRef, Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { ScheduleRepository } from './repository/schedule.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleExecutionRepository } from './repository/schedule-execution.repository';
import { ScheduleMessageRunnerModule } from '../schedule-message-runner/schedule-message-runner.module';
import { AmqpModule } from '../services/amqp/amqp.module';

@Module({
  imports: [
    forwardRef(() => ScheduleMessageRunnerModule),
    forwardRef(() => AmqpModule),
    TypeOrmModule.forFeature([ScheduleRepository, ScheduleExecutionRepository]),
    ScheduleModule,
  ],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
