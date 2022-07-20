import { MessageDto } from 'src/common/dto/message.dto';
import { AmqpProducer } from '../amqp.producer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RingcentralService {
  constructor(private readonly _amqpProducer: AmqpProducer) {}

  public async sendMessage(message: MessageDto): Promise<any> {
    return await this._amqpProducer.sendMessage(message);
  }
}
