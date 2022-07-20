import { ScheduleMessageQueueProducer } from './schedule-message-queue.producer';
import { ScheduleMessageQueueConsumer } from './schedule-message-queue.consumer';
import { ScheduleMessageQueueService } from './schedule-message-queue.service';
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleExecutionRepository } from 'src/modules/scheduler/repository/schedule-execution.repository';
import { ScheduleRepository } from 'src/modules/scheduler/repository/schedule.repository';
import { AmqpModule } from 'src/modules/services/amqp/amqp.module';

@Module({
  imports: [
    ScheduleModule,
    AmqpModule,
    TypeOrmModule.forFeature([ScheduleExecutionRepository, ScheduleRepository]),
    BullModule.registerQueue({
      name: 'schedule_message-queue',
    }),
    // AmqpModule,
  ],
  providers: [
    ScheduleMessageQueueService,
    ScheduleMessageQueueConsumer,
    ScheduleMessageQueueProducer,
  ],
  exports: [ScheduleMessageQueueService, BullModule],
})
export class ScheduleMessageQueueModule {}
