import { QueuesModule } from './modules/queues/queues.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfigAsync } from './common/config/typeorm.config';
import { AmqpModule } from './modules/services/amqp/amqp.module';

import { ScheduleModule } from '@nestjs/schedule';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { ScheduleMessageRunnerModule } from './modules/schedule-message-runner/schedule-message-runner.module';
import { BullModule } from '@nestjs/bull';
import { redisQueueConfigAsync } from './common/config/redis-queue.config';
@Module({
  imports: [
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    ScheduleModule.forRoot(),
    ScheduleMessageRunnerModule,
    SchedulerModule,
    AmqpModule,
    QueuesModule,
    BullModule.forRootAsync(redisQueueConfigAsync),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
