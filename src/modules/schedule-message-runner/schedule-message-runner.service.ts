/* eslint-disable @typescript-eslint/no-unused-vars */
import { forwardRef, Inject, Injectable, Scope } from '@nestjs/common';
import { ScheduleMessageQueueService } from '../queues/modules/schedule-message-queue/schedule-message-queue.service';
import { ScheduleDto } from '../scheduler/dto/schedule.dto';
import { ScheduleExecution } from '../scheduler/entity/schedule-execution.entity';
import { SchedulerService } from '../scheduler/scheduler.service';

@Injectable()
export class ScheduleMessageRunnerService {
  constructor(
    private readonly _scheduleMessageQueueService: ScheduleMessageQueueService,
    @Inject(forwardRef(() => SchedulerService))
    private readonly _schedulerService: SchedulerService,
  ) {}

  //* add new scheduler after add new schedule_message at backend service
  public async addScheduleMessage(schedule: ScheduleDto) {
    return await this._schedulerService.addSchedule(schedule);
  }

  //* update schedule message after update schedule_message at backend service
  public async updateScheduleMessage(schedule: ScheduleDto) {
    return await this._schedulerService.updateSchedule(schedule);
  }

  //* run schedule immediately
  public async startScheduleMessage(
    sendMessageDataList: any,
    scheduleExecution: ScheduleExecution,
    scheduleMessageId: string,
  ) {
    //* add sendMessageDataList to job
    await this._scheduleMessageQueueService.addSendMessageJobs(
      sendMessageDataList,
      scheduleExecution,
      scheduleMessageId,
    );
  }

  //* pause schedule is running
  public async pauseScheduleMessage(scheduleMessageId: string) {
    //* remove every job with jobName = scheduleMessageId,
    await this._scheduleMessageQueueService.removeScheduleMessageJobs(
      scheduleMessageId,
    );
  }

  //* resume schedule is resuming
  public async resumeScheduleMessage(
    scheduleMessageId: string,
    sendMessageDataList: any,
  ) {
    return await this._schedulerService.resumeScheduleMessage(
      scheduleMessageId,
      sendMessageDataList,
    );
  }

  public async _resumeScheduleMessage(
    scheduleExecution: ScheduleExecution,
    scheduleMessageId: string,
    sendMessageDataList: any,
  ) {
    return await this._scheduleMessageQueueService.resumeMessageJobs(
      scheduleExecution,
      scheduleMessageId,
      sendMessageDataList,
    );
  }

  //* same delete action
  public async stopScheduleMessage(schedule: ScheduleDto) {
    return await this._schedulerService.stopScheduleMessage(schedule);
  }

  //* pause Queue are running
  public async pauseQueueRunner(schedule: ScheduleDto) {
    return await this._schedulerService.pauseQueueSchedule(schedule);
  }

  public async _pauseQueueRunner(schedule: ScheduleDto) {
    return await this._scheduleMessageQueueService.pauseSendMessageJobs(
      schedule,
    );
  }
}
