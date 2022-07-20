import { delay } from './../../../../common/utils/delay';
import {
  Processor,
  Process,
  OnQueueCompleted,
  OnQueueFailed,
} from '@nestjs/bull';
import { Job } from 'bull';
import * as moment from 'moment';
import { ScheduleStatus } from 'src/modules/scheduler/enum/schedule-status';
import { ScheduleExecutionStatus } from 'src/modules/scheduler/enum/schedule-status.type';
import { ScheduleExecutionRepository } from 'src/modules/scheduler/repository/schedule-execution.repository';
import { ScheduleRepository } from 'src/modules/scheduler/repository/schedule.repository';
import { BackendService } from 'src/modules/services/amqp/services/backend.service';
import { ScheduleMessageQueueService } from './schedule-message-queue.service';

@Processor('schedule_message-queue')
export class ScheduleMessageQueueConsumer {
  constructor(
    private readonly _scheduleMessageQueueService: ScheduleMessageQueueService,
    private readonly scheduleExecutionRepository: ScheduleExecutionRepository,
    private readonly scheduleRepository: ScheduleRepository,
    private readonly _backendService: BackendService,
  ) {}
  @Process('send_message')
  async sendMessage(job: Job<any>) {
    try {
      const date = new Date();
      const dataTime = moment(date).subtract(2, 'hours');
      const sub = moment(job.data.creationTime);
      const scheduleExecution = await this.scheduleExecutionRepository.findOne({
        relations: ['schedule'],
        where: {
          id: job.data.scheduleExecution.id,
        },
      });
      const schedule = await this.scheduleRepository.findOne({
        where: {
          id: scheduleExecution.schedule.id,
        },
      });
      schedule.sendStatus = ScheduleStatus.SENDING;
      if (dataTime.isAfter(sub)) {
        await this._scheduleMessageQueueService.handleJobsLate(
          job.data.scheduleExecution.id,
        );
        scheduleExecution.executionStatus = ScheduleExecutionStatus.FINISHED;
        await scheduleExecution.save();
        schedule.sendStatus = ScheduleStatus.DONE;
        await schedule.save();
        await this._backendService.sendNewMessage({
          messageSetId: job.data.content,
          status: ScheduleStatus.LATE,
        });
      } else {
        const jobsExisting =
          await this._scheduleMessageQueueService.checkLastJob(
            job.data.scheduleExecution.id,
            ['waiting', 'active'],
          );
        if (jobsExisting) {
          scheduleExecution.executionStatus = ScheduleExecutionStatus.FINISHED;
          await scheduleExecution.save();
          schedule.sendStatus = ScheduleStatus.DONE;
          await schedule.save();
          await this._backendService.sendNewMessage({
            messageSetId: job.data.content,
            status: 'last',
          });
        } else {
          await schedule.save();
          await this._backendService.sendNewMessage({
            messageSetId: job.data.content,
            status: schedule.sendStatus,
          });
        }

        await delay(parseInt(process.env.MESSAGE_SCHEDULE_DELAY));
      }
    } catch (error) {
      await this._backendService.sendNewMessage({
        messageSetId: job.data.content,
        status: 'error',
      });
    }
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    //TODO: update status message.messageStatus = 'sending'
    //TODO: schedule_set = 'done'
  }

  @OnQueueFailed()
  onFailed(job: Job, err: Error) {
    //TODO: update status message.messageStatus = 'error', schedule_set = 'error'
  }
}
