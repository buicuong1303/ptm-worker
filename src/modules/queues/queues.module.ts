import { Module } from '@nestjs/common';
import { QueuesProvider } from './queues.provider';
import { ScheduleMessageQueueModule } from './modules/schedule-message-queue/schedule-message-queue.module';
import { AmqpModule } from '../services/amqp/amqp.module';

@Module({
  imports: [ScheduleMessageQueueModule],
  providers: [QueuesProvider],
})
export class QueuesModule {}
