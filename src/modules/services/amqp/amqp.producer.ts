import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { TimeoutError } from 'rxjs';
@Injectable()
export class AmqpProducer {
  constructor(private readonly _amqpConnection: AmqpConnection) {}

  public async startSchedule(message: any) {
    try {
      const data = await this._amqpConnection.request<any>({
        exchange: 'phpswteam.php_text_message',
        routingKey: 'schedule_message.cmd.run.worker.backend',
        payload: {
          request: message,
        },
      });
      return data;
    } catch (error) {
      throw new TimeoutError();
    }
  }

  public async sendMessage(message: any) {
    try {
      await this._amqpConnection.request({
        exchange: 'phpswteam.php_text_message',
        routingKey: 'schedule_message.cmd.send_message.worker.backend',
        payload: message,
      });
    } catch (error) {
      throw new TimeoutError();
    }
  }

  public async syncMessage(timeFrom: string, timeTo: string) {
    return this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'message.cmd.sync.worker.backend',
      { timeFrom, timeTo },
    );
  }

  public async syncQueuedMessage() {
    this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'queued_message.cmd.sync.worker.backend',
      {},
    );
  }

  public async syncMissedCall(backTime: number) {
    return this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'missed_call.cmd.sync.worker.backend',
      backTime,
    );
  }

  public async syncMessageAfterRestart() {
    return this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'message.cmd.sync_after_restart.worker.backend',
      {},
    );
  }

  public async syncMissedCallAfterRestart() {
    return this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'missed_call.cmd.sync_after_restart.worker.backend',
      {},
    );
  }

  public async trainSensitive(direction: string) {
    console.log('trigger train: ' + direction);
    return this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'sensitive.cmd.train.worker.backend',
      { direction },
    );
  }

  public async _syncDetectScheduleMessagesFail() {
    return this._amqpConnection.publish(
      'phpswteam.php_text_message',
      'schedule.cmd.message_fail.worker.backend',
      {},
    );
  }
}
