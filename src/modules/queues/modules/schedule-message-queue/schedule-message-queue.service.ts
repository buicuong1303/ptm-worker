import { ScheduleMessageQueueProducer } from './schedule-message-queue.producer';
import { Injectable } from '@nestjs/common';
import { SendMessageJobDataDto } from './dto/send-message-job-data.dto';
import { ScheduleExecution } from 'src/modules/scheduler/entity/schedule-execution.entity';
import { JobStatus } from 'bull';
import { ScheduleDto } from 'src/modules/scheduler/dto/schedule.dto';

@Injectable()
export class ScheduleMessageQueueService {
  constructor(
    private readonly _scheduleMessageProducer: ScheduleMessageQueueProducer,
  ) {}

  public async addSendMessageJobs(
    sendMessageDataList: any,
    scheduleExecution: ScheduleExecution,
    scheduleMessageId: string,
  ) {
    return await this._scheduleMessageProducer.addSendMessageJobs(
      sendMessageDataList,
      scheduleExecution,
      scheduleMessageId,
    );
  }

  public async removeScheduleMessageJobs(
    scheduleMessageId: string,
  ): Promise<SendMessageJobDataDto[]> {
    return await this._scheduleMessageProducer.removeScheduleMessageJobs(
      scheduleMessageId,
    );
  }

  public async pauseSendMessageJobs(schedule: ScheduleDto) {
    return await this._scheduleMessageProducer.pauseSchedule(schedule);
  }

  public async resumeMessageJobs(
    scheduleExecution: ScheduleExecution,
    scheduleMessageId: string,
    sendMessageDataList: any,
  ) {
    return await this._scheduleMessageProducer.resumeSchedule(
      scheduleExecution,
      scheduleMessageId,
      sendMessageDataList,
    );
  }

  public async checkLastJob(executionScheduleId, statuses: JobStatus[]) {
    return await this._scheduleMessageProducer.checkLastJobOfSchedule(
      executionScheduleId,
      statuses,
    );
  }

  public async handleJobsLate(executionScheduleId) {
    return await this._scheduleMessageProducer.handleJobsLate(
      executionScheduleId,
    );
  }
}
