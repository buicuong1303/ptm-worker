import { SendMessageJobDataDto } from './dto/send-message-job-data.dto';
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as _ from 'lodash';
import { Queue } from 'bull';
import { Job, JobStatus } from 'bull';
import { ScheduleExecution } from 'src/modules/scheduler/entity/schedule-execution.entity';
import { JobDataDto } from './dto/job-data.dto';
import { ScheduleDto } from 'src/modules/scheduler/dto/schedule.dto';

@Injectable()
export class ScheduleMessageQueueProducer {
  constructor(
    @InjectQueue('schedule_message-queue')
    private readonly _scheduleMessageQueue: Queue,
  ) {}

  //*Handle Pause a Schedule
  public async pauseSchedule(schedule: ScheduleDto): Promise<any> {
    try {
      await this._scheduleMessageQueue.pause();
      const findZone: JobStatus[] = ['waiting', 'paused'];
      const jobs: Job[] = await this._scheduleMessageQueue.getJobs([
        ...findZone,
      ]);
      const jobsRemove = jobs.filter((job) => {
        if (job.data.scheduleMessageId === schedule.data.scheduleMessageId) {
          job.remove();
          return true;
        }
        return false;
      });
      await Promise.all(jobsRemove);
      await this._scheduleMessageQueue.resume();
      return jobsRemove.map((item) => {
        return item.data.content;
      });
    } catch (error) {
      throw error;
    }
  }

  public async resumeSchedule(
    scheduleExecution: ScheduleExecution,
    scheduleMessageId: string,
    sendMessageDataList: any,
  ): Promise<any> {
    for (let index = 0; index < sendMessageDataList.length; index++) {
      const sendMessageData = sendMessageDataList[index];
      await this._addSendMessageJob({
        content: sendMessageData,
        scheduleExecution: scheduleExecution,
        scheduleMessageId: scheduleMessageId,
        creationTime: scheduleExecution.creationTime,
        index: index,
        // thread
      });
    }
    return true;
  }

  //*Handle Remove a Schedule
  public async removeScheduleMessageJobs(
    scheduleMessageId: string,
  ): Promise<SendMessageJobDataDto[]> {
    await this._scheduleMessageQueue.pause();
    const jobs = await this._getJobsSameScheduleId(scheduleMessageId, [
      'paused',
    ]);

    const removeMessages: SendMessageJobDataDto[] = jobs.map((job) => job.data);

    const removeJobs = jobs.map((job) => job.remove());

    await Promise.all(removeJobs);

    await this._scheduleMessageQueue.resume();

    return removeMessages;
  }

  //*Handle add jobs to queue
  public async addSendMessageJobs(
    sendMessageDataList: any,
    scheduleExecution: ScheduleExecution,
    scheduleMessageId: string,
  ) {
    await this._scheduleMessageQueue.resume();
    for (let index = 0; index < sendMessageDataList.length; index++) {
      const sendMessageData = sendMessageDataList[index];
      await this._addSendMessageJob({
        content: sendMessageData,
        scheduleExecution: scheduleExecution,
        scheduleMessageId: scheduleMessageId,
        creationTime: scheduleExecution.creationTime,
        index: index,
      });
    }
  }

  //*Handle Check last message of a schedule
  public async checkLastJobOfSchedule(
    executionScheduleId,
    statuses: JobStatus[],
  ): Promise<any> {
    const jobs: Job[] = await this._scheduleMessageQueue.getJobs([...statuses]);
    const jobsExisting = jobs.filter(
      (job) => job.data.scheduleExecution.id === executionScheduleId,
    );
    if (jobsExisting.length > 1) return false;
    return true;
  }

  //*Handle Jobs late
  public async handleJobsLate(executionScheduleId): Promise<any> {
    await this._scheduleMessageQueue.pause();
    const findZone: JobStatus[] = ['waiting', 'paused'];
    const jobs: Job[] = await this._scheduleMessageQueue.getJobs([...findZone]);
    const jobsRemove = jobs.filter((job) => {
      if (job.data.scheduleExecution.id === executionScheduleId) {
        job.remove();
        return true;
      }
      return false;
    });
    await Promise.all(jobsRemove);
    await this._scheduleMessageQueue.resume();
  }

  private async _getJobsSameScheduleId(
    scheduleMessageId,
    statuses: JobStatus[],
  ): Promise<Job[]> {
    const jobs: Job[] = await this._scheduleMessageQueue.getJobs([...statuses]);
    const filterJobs = jobs.filter(
      (job) => job.data.content.scheduleMessageId === scheduleMessageId,
    );
    return filterJobs;
  }

  private async _addSendMessageJob(sendMessageData: JobDataDto) {
    await this._scheduleMessageQueue.add(
      'send_message', //* name
      sendMessageData, //* job data
      {
        attempts: 0,
        removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
        removeOnFail: false,
      },
    );
  }
}
