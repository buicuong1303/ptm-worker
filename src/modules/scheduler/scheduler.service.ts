import { delay } from './../../common/utils/delay';
import { EntityStatus } from 'src/common/constant/entity-status';
import { Schedule } from './entity/schedule.entity';
import {
  Injectable,
  forwardRef,
  Inject,
  NotFoundException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { ScheduleJobType } from './enum/schedule-job-type';
import { ScheduleType } from './enum/schedule.type';
import { CronJob } from 'cron';
import { ScheduleRepository } from './repository/schedule.repository';
import { ScheduleDto } from './dto/schedule.dto';
import * as momenttz from 'moment-timezone';
import { ScheduleMessageRunnerService } from '../schedule-message-runner/schedule-message-runner.service';
import { ScheduleExecution } from './entity/schedule-execution.entity';
import { ScheduleExecutionStatus } from './enum/schedule-status.type';
import { ScheduleStatus } from './enum/schedule-status';
import { BackendService } from '../services/amqp/services/backend.service';
import { ScheduleExecutionRepository } from './repository/schedule-execution.repository';
import { Not } from 'typeorm';
import * as moment from 'moment';

@Injectable()
export class SchedulerService implements OnApplicationBootstrap {
  private logger: Logger = new Logger(SchedulerService.name);
  constructor(
    private readonly _schedulerRegistry: SchedulerRegistry,
    private readonly _backendService: BackendService,
    private readonly _scheduleRepository: ScheduleRepository,
    private readonly _scheduleExecutionRepository: ScheduleExecutionRepository,
    @Inject(forwardRef(() => ScheduleMessageRunnerService))
    private readonly _scheduleMessageRunnerService: ScheduleMessageRunnerService,
  ) {}

  onApplicationBootstrap() {
    setTimeout(async () => {
      await this._reschedule();
    }, 2000);

    setTimeout(async () => {
      await this._backendService.syncMessageAfterRestart();
    }, 10 * 1000);

    setTimeout(async () => {
      await this._backendService.syncMissedCallAfterRestart();
    }, 30 * 1000);
  }

  private async _reschedule() {
    const scheduleWaiting = await this._scheduleRepository.find({
      where: {
        sendStatus: ScheduleStatus.WAITING,
      },
    });
    const listScheduleError = [];
    const scheduleFilter = scheduleWaiting.filter((item) => {
      if (moment().isBefore(item.specifiedDate)) {
        return true;
      } else {
        listScheduleError.push(item);
        return false;
      }
    });
    for (let i = 0; i < listScheduleError.length; i++) {
      const schedule = await this._scheduleRepository.findOne({
        where: {
          id: listScheduleError[i].id,
        },
      });
      schedule.sendStatus = ScheduleStatus.DONE;
      await schedule.save();
    }
    if (scheduleFilter.length > 0) {
      for (let i = 0; i < scheduleFilter.length; i++) {
        await this._handleAddSendScheduleMessageJob(scheduleFilter[i]);
      }
    }
  }

  public async addSchedule(schedule: ScheduleDto) {
    try {
      const newSchedule = new Schedule();
      newSchedule.sendStatus = ScheduleStatus.WAITING;
      newSchedule.cronExpression = schedule.cronExpression;
      newSchedule.jobType = schedule.jobType;
      newSchedule.data = schedule.data;
      newSchedule.type = schedule.type;
      newSchedule.specifiedDate = schedule.specifiedDate;
      await newSchedule.save();
      switch (schedule.jobType) {
        case ScheduleJobType.SEND_SCHEDULE_MESSAGE: {
          this._handleAddSendScheduleMessageJob(newSchedule);
          break;
        }

        case ScheduleJobType.RUN_DAILY_REPORT: {
          break;
        }

        case ScheduleJobType.RUN_WEEKLY_REPORT: {
          break;
        }

        default: {
          break;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  public async stopScheduleMessage(schedule: ScheduleDto) {
    const newSchedule = await this._scheduleRepository.find({
      where: {
        status: EntityStatus.ACTIVE,
        sendStatus: Not(ScheduleStatus.STOP),
      },
    });
    const scheduleFilter = newSchedule.filter((item) => {
      if (item.data.scheduleMessageId === schedule.data.scheduleMessageId) {
        return true;
      }
      return false;
    });
    scheduleFilter[0].sendStatus = ScheduleStatus.STOP;
    await scheduleFilter[0].save();
    const scheduleExecution = await this._scheduleExecutionRepository.find({
      where: {
        schedule: scheduleFilter[0],
      },
    });
    scheduleExecution.map(async (item) => {
      item.executionStatus = ScheduleExecutionStatus.FINISHED;
      await item.save();
    });
    await Promise.all(scheduleExecution);
    return await this.deleteSchedule(schedule);
  }

  //only update milliseconds | cronExpression | specifiedDate
  public async updateSchedule(schedule: ScheduleDto) {
    try {
      const newSchedule = await this._scheduleRepository.find({
        where: {
          status: EntityStatus.ACTIVE,
          sendStatus: Not(ScheduleStatus.STOP),
        },
      });
      const scheduleFilter = newSchedule.filter((item) => {
        if (item.data.scheduleMessageId === schedule.data.scheduleMessageId) {
          return true;
        }
        return false;
      });
      scheduleFilter[0].sendStatus = ScheduleStatus.STOP;
      await scheduleFilter[0].save();
      this._schedulerRegistry.deleteCronJob(schedule.data.scheduleMessageId);
      await this.addSchedule(schedule);
      return true;
    } catch (err) {
      return err;
    }
  }

  public async deleteSchedule(schedule: ScheduleDto): Promise<any> {
    try {
      const scheduleExisted = this._schedulerRegistry.doesExists(
        'cron',
        schedule.data.scheduleMessageId,
      );
      if (scheduleExisted) {
        await this._schedulerRegistry.deleteCronJob(
          schedule.data.scheduleMessageId,
        );
        return await this._pauseQueueSchedule(schedule);
      } else {
        return await this._pauseQueueSchedule(schedule);
      }
    } catch (err) {
      throw new NotFoundException('Not found schedule !!!');
    }
  }

  public startSchedule(schedule: ScheduleDto) {
    const job = this._schedulerRegistry.getCronJob(
      schedule.data.scheduleMessageId,
    );
    job.start();
  }

  public async pauseQueueSchedule(schedule: ScheduleDto) {
    try {
      const newSchedule = await this._scheduleRepository.find({
        where: {
          status: EntityStatus.ACTIVE,
          sendStatus: Not(ScheduleStatus.STOP),
        },
      });
      const scheduleFilter = newSchedule.filter((item) => {
        if (item.data.scheduleMessageId === schedule.data.scheduleMessageId) {
          return true;
        }
        return false;
      });
      const scheduleExecution = await this._scheduleExecutionRepository.find({
        where: {
          schedule: scheduleFilter[0],
          executionStatus: ScheduleExecutionStatus.EXECUTING,
        },
      });
      scheduleExecution.map(async (item) => {
        item.executionStatus = ScheduleExecutionStatus.PAUSING;
        await item.save();
      });
      await Promise.all(scheduleExecution);
      return await this.deleteSchedule(schedule);
    } catch (error) {
      throw error;
    }
  }

  public async resumeScheduleMessage(
    scheduleMessageId: string,
    sendMessageDataList: any,
  ) {
    try {
      const listSchedule = await this._scheduleRepository.find({
        where: {
          status: EntityStatus.ACTIVE,
          sendStatus: Not(ScheduleStatus.STOP),
        },
      });
      const scheduleFilter = listSchedule.filter((item) => {
        if (item.data.scheduleMessageId === scheduleMessageId) {
          return true;
        }
        return false;
      });
      if (scheduleFilter.length < 0) {
        throw new NotFoundException('Not found schedule !!!');
      }
      const schedule = scheduleFilter[0];
      schedule.sendStatus = ScheduleStatus.SENDING;
      await schedule.save();
      const scheduleExecution = await this._scheduleExecutionRepository.findOne(
        {
          where: {
            schedule: schedule,
            executionStatus: ScheduleExecutionStatus.PAUSING,
          },
        },
      );
      scheduleExecution.executionStatus = ScheduleExecutionStatus.EXECUTING;
      await scheduleExecution.save();
      const callback = () => this._startScheduleMessageCallback(schedule);
      switch (schedule.type) {
        case ScheduleType.CRON: {
          this._addCronJob(schedule, callback);
          break;
        }

        // case ScheduleType.DATE: {
        //   this._addDateJob(schedule, callback);
        //   break;
        // }

        default: {
          break;
        }
      }

      return await this._scheduleMessageRunnerService._resumeScheduleMessage(
        scheduleExecution,
        scheduleMessageId,
        sendMessageDataList,
      );
    } catch (err) {
      throw new NotFoundException('Cant resume schedule');
    }
  }

  private async _pauseQueueSchedule(schedule: ScheduleDto) {
    return await this._scheduleMessageRunnerService._pauseQueueRunner(schedule);
  }

  private _handleAddSendScheduleMessageJob(schedule: Schedule) {
    try {
      const callback = () => this._startScheduleMessageCallback(schedule);
      switch (schedule.type) {
        case ScheduleType.CRON: {
          this._addCronJob(schedule, callback);
          break;
        }

        case ScheduleType.DATE: {
          // this._startScheduleMessageCallback(schedule);
          this._addDateJob(schedule, callback);
          break;
        }

        default: {
          break;
        }
      }
    } catch (error) {
      throw error;
    }
  }

  //* callback for _handleAddSendScheduleMessageJob execute
  private async _startScheduleMessageCallback(schedule: Schedule) {
    const listMessageSetData = await this._backendService.getScheduleMessage({
      scheduleMessageId: schedule.data.scheduleMessageId,
    });
    const scheduleExecution = new ScheduleExecution();
    scheduleExecution.schedule = schedule;
    scheduleExecution.executionStatus = ScheduleExecutionStatus.EXECUTING;
    await scheduleExecution.save();

    await this._scheduleMessageRunnerService.startScheduleMessage(
      listMessageSetData,
      scheduleExecution,
      schedule.data.scheduleMessageId,
    );
  }

  private async _addDateJob(schedule: Schedule, callback: any) {
    try {
      const time = momenttz.tz(schedule.specifiedDate, 'america/los_angeles');
      const job = new CronJob(time, callback);

      await this._schedulerRegistry.addCronJob(
        schedule.data.scheduleMessageId,
        job,
      );
      job.start();
    } catch (error) {
      throw new NotFoundException('Add Schedule Error');
    }
  }

  private async _addCronJob(schedule: Schedule, callback: any) {
    const job = new CronJob(
      schedule.cronExpression,
      callback,
      null,
      false,
      'America/Los_Angeles',
    );
    await this._schedulerRegistry.addCronJob(
      schedule.data.scheduleMessageId,
      job,
    );
    job.start();
  }

  @Cron(process.env.LONG_POLLING_MESSAGE_CRON) //* only work 1 time per day, range time backup is 7 days before
  private async _syncMessageLongPulling() {
    this.logger.debug(`Start long polling...`);
    const backupDays = 7;
    const now = momenttz(new Date());
    let previousFromTime = now;

    //* 7 day same 168 hours
    //* range time per time get message is 6 hours
    //* have 28 times to need call sync message
    //* call sync message between 1:00 AM - 5:00 AM (4 hours)
    //* delay per time call sync message is 8 minutes

    for (let index = 0; index < (backupDays * 24) / 6; index++) {
      const timeTo = previousFromTime;
      const timeFrom = timeTo.clone();
      timeFrom.subtract('6', 'hours');

      await this._backendService.syncMessage(
        timeFrom.clone().subtract('5', 'minutes').toISOString(),
        timeTo.clone().add('5', 'minutes').toISOString(),
      );
      previousFromTime = timeFrom;
      this.logger.debug(
        `Long polling ${index + 1} time, timeFrom: ${timeFrom
          .clone()
          .subtract('5', 'minutes')
          .toISOString()}, timeTo: ${timeTo
          .clone()
          .add('5', 'minutes')
          .toISOString()}`,
      );

      await delay(8 * 60 * 1000);
    }
  }

  @Cron(`*/${process.env.POLLING_MESSAGE_TIMEOUT} * * * *`)
  private async _syncMessage() {
    const backTime: number = parseInt(process.env.POLLING_MESSAGE_TIMEOUT);

    const timeFrom: string = momenttz(new Date())
      .subtract(backTime + 5, 'minutes')
      .toISOString();
    const timeTo: string = momenttz(new Date()).toISOString();

    await this._backendService.syncMessage(timeFrom, timeTo);
  }

  @Cron(`*/${process.env.POLLING_QUEUED_MESSAGE_TIMEOUT} * * * *`)
  private async _syncQueuedMessage() {
    await this._backendService.syncQueuedMessage();
  }

  @Cron(`*/${process.env.POLLING_MISSED_CALL_TIMEOUT} * * * *`)
  private async _syncMissedCall() {
    const backTime: number = parseInt(process.env.POLLING_MISSED_CALL_TIMEOUT);
    await this._backendService.syncMissedCall(backTime);
  }

  @Cron(`*/${process.env.POLLING_SCHEDULE_MESSAGE_FAIL_TIMEOUT} * * * *`)
  private async _detectScheduleMessagesFail() {
    await this._backendService.detectScheduleMessagesFail();
  }

  @Cron(`00 00 ${process.env.TRAIN_INBOUND_SCHEDULE} * * *`)
  private async _trainInboundSensitive() {
    await this._backendService.trainSensitive('inbound');
  }

  @Cron(`00 00 ${process.env.TRAIN_OUTBOUND_SCHEDULE} * * *`)
  private async _trainOutboundSensitive() {
    await this._backendService.trainSensitive('outbound');
  }
}
