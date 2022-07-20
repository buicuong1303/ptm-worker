import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { setQueues, BullMQAdapter } from 'bull-board';
import { Queue as QueueMQ } from 'bullmq';

@Injectable()
export class QueuesProvider {
  constructor(
    @InjectQueue('schedule_message-queue')
    private readonly scheduleMessageQueue: QueueMQ,
  ) {
    this._setupBullQueueMonitoring();
  }

  private _setupBullQueueMonitoring = () => {
    const bullMQAdapters: BullMQAdapter[] = [
      new BullMQAdapter(this.scheduleMessageQueue),
    ];

    setQueues(bullMQAdapters);
  };
}
