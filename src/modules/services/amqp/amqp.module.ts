import { ScheduleMessageRunnerModule } from './../../schedule-message-runner/schedule-message-runner.module';
import { AmqpConsumer } from './amqp.consumer';
import { AmqpProducer } from './amqp.producer';
import { Module } from '@nestjs/common';
import { RingcentralService } from './services/ringcentral.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackendService } from './services/backend.service';
import { rabbitMqConfigAsync } from 'src/common/config/rabbitmq.config';
import { ScheduleRepository } from 'src/modules/scheduler/repository/schedule.repository';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      //* for current scope
      ScheduleRepository,
    ]),
    RabbitMQModule.forRootAsync(RabbitMQModule, rabbitMqConfigAsync),
    ScheduleMessageRunnerModule,
  ],
  providers: [AmqpProducer, AmqpConsumer, RingcentralService, BackendService],
  exports: [BackendService, RingcentralService],
})
export class AmqpModule {}
