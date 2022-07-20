import { AmqpProducer } from '../amqp.producer';
import { Injectable } from '@nestjs/common';
@Injectable()
export class BackendService {
  constructor(private readonly _amqpProducer: AmqpProducer) {}

  public async getScheduleMessage(message: any): Promise<any> {
    return await this._amqpProducer.startSchedule(message);
  }

  //* message was created from schedule_set
  public async sendNewMessage(message): Promise<void> {
    return await this._amqpProducer.sendMessage(message);
  }

  public syncMessage(timeFrom: string, timeTo: string): Promise<void> {
    return this._amqpProducer.syncMessage(timeFrom, timeTo);
  }

  public syncQueuedMessage(): Promise<void> {
    return this._amqpProducer.syncQueuedMessage();
  }

  public syncMissedCall(backTime: number): Promise<void> {
    return this._amqpProducer.syncMissedCall(backTime);
  }

  public syncMessageAfterRestart(): Promise<void> {
    return this._amqpProducer.syncMessageAfterRestart();
  }

  public syncMissedCallAfterRestart(): Promise<void> {
    return this._amqpProducer.syncMissedCallAfterRestart();
  }

  public trainSensitive(direction: string): Promise<void> {
    return this._amqpProducer.trainSensitive(direction);
  }

  public detectScheduleMessagesFail(): Promise<void> {
    return this._amqpProducer._syncDetectScheduleMessagesFail();
  }
}
