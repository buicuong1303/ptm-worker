import { ScheduleDto } from 'src/modules/scheduler/dto/schedule.dto';
import { Injectable } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { ScheduleMessageRunnerService } from '../../schedule-message-runner/schedule-message-runner.service';
import { SendMessageJobDataDto } from '../../queues/modules/schedule-message-queue/dto/send-message-job-data.dto';
import { ScheduleMessageRunnerDto } from '../../schedule-message-runner/dto/schedule-message-runner.dto';
import { ScheduleType } from 'src/modules/scheduler/enum/schedule.type';
import { ScheduleJobType } from 'src/modules/scheduler/enum/schedule-job-type';
import { ConsumeMessage } from 'amqplib';
@Injectable()
export class AmqpConsumer {
  constructor(
    private readonly _scheduleMessageRunnerService: ScheduleMessageRunnerService,
  ) {}

  //* run schedule immediately
  // private startScheduleMessage(
  //   _scheduleMessageRunner: ScheduleMessageRunnerDto,
  //   _sendMessageDataList: SendMessageJobDataDto[],
  // ) {
  //   // this._scheduleMessageRunnerService.startScheduleMessage(
  //   //   // scheduleMessageRunner,
  //   //   sendMessageDataList,
  //   // );
  // }

  //* update schedule
  // public updateSchedule(schedule: ScheduleDto) {
  //   return this._scheduleMessageRunnerService.updateScheduleMessage(schedule);
  // }

  //*===============================================================================================

  //Pause Schedule
  @RabbitRPC({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'schedule_massage.cmd.pause.backend.worker',
    queue:
      'phpswteam.php_text_message-schedule_massage.cmd.pause.backend.worker',
    queueOptions: {
      messageTtl: 1000,
    },
  })
  public async pauseScheduleMessage(data: any) {
    try {
      const schedule: ScheduleDto = {
        type: ScheduleType.CRON,
        specifiedDate: null,
        cronExpression: '*/20 * * * * *',
        jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
        data: {
          scheduleMessageId: data.request,
        },
      };
      const payload = await this._scheduleMessageRunnerService.pauseQueueRunner(
        schedule,
      );
      return payload;
    } catch (error) {
      return error;
    }
  }

  //Stop Schedule
  @RabbitRPC({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'schedule_massage.cmd.stop.backend.worker',
    queue:
      'phpswteam.php_text_message-schedule_massage.cmd.stop.backend.worker',
    queueOptions: {
      messageTtl: 1000,
    },
  })
  public async stopScheduleMessage(data: any) {
    const schedule: ScheduleDto = {
      type: ScheduleType.CRON,
      specifiedDate: null,
      cronExpression: '*/20 * * * * *',
      jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
      data: {
        scheduleMessageId: data.request,
      },
    };
    const response =
      await this._scheduleMessageRunnerService.stopScheduleMessage(schedule);
    return response;
  }

  //Create Schedule
  @RabbitRPC({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'schedule_massage.cmd.create.backend.worker',
    queue:
      'phpswteam.php_text_message-schedule_massage.cmd.create.backend.worker',
    queueOptions: {
      messageTtl: 1000,
    },
  })
  public async createScheduleMessage(data: any) {
    try {
      const newCron = data.request.cronExpression.replace('?', '*');
      const date = new Date(data.request.specifiedDate);
      if (data.request.isCronExpression) {
        const schedule: ScheduleDto = {
          type: ScheduleType.CRON,
          specifiedDate: null,
          cronExpression: newCron,
          jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
          data: {
            scheduleMessageId: data.request.scheduleMessageId,
          },
        };
        await this._scheduleMessageRunnerService.addScheduleMessage(schedule);
        return true;
      } else {
        const schedule: ScheduleDto = {
          type: ScheduleType.DATE,
          specifiedDate: date,
          cronExpression: '',
          jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
          data: {
            scheduleMessageId: data.request.scheduleMessageId,
          },
        };
        await this._scheduleMessageRunnerService.addScheduleMessage(schedule);
        return true;
      }
    } catch (error) {
      return error;
    }
  }

  //Resume Schedule
  @RabbitRPC({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'schedule_massage.cmd.resume.backend.worker',
    queue:
      'phpswteam.php_text_message-schedule_massage.cmd.resume.backend.worker',
    queueOptions: {
      messageTtl: 1000,
    },
  })
  public async resumesScheduleMessage(data: any) {
    try {
      return await this._scheduleMessageRunnerService.resumeScheduleMessage(
        data.request.scheduleMessageId,
        data.request.sendMessageDataList,
      );
    } catch (error) {
      return error;
    }
  }

  //Update Schedule Message
  @RabbitRPC({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'schedule_massage.cmd.update.backend.worker',
    queue:
      'phpswteam.php_text_message-schedule_massage.cmd.update.backend.worker',
    queueOptions: {
      messageTtl: 1000,
    },
  })
  public async updateScheduleMessage(data: any) {
    const newCron = data.request.cronExpression.replace('?', '*');
    const date = new Date(data.request.specifiedDate);
    if (data.request.isCronExpression) {
      const schedule: ScheduleDto = {
        type: ScheduleType.CRON,
        specifiedDate: null,
        cronExpression: newCron,
        jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
        data: {
          scheduleMessageId: data.request.scheduleMessageId,
        },
      };
      return this._scheduleMessageRunnerService.updateScheduleMessage(schedule);
    } else {
      const schedule: ScheduleDto = {
        type: ScheduleType.DATE,
        specifiedDate: date,
        cronExpression: '',
        jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
        data: {
          scheduleMessageId: data.request.scheduleMessageId,
        },
      };
      return this._scheduleMessageRunnerService.updateScheduleMessage(schedule);
    }
  }
  //#region //* old code
  // @RabbitRPC({
  //   exchange: 'phpswteam.php_text_message',
  //   routingKey: 'schedule_massage.cmd.*.backend.worker',
  //   queue:
  //     'phpswteam.php_text_message-schedule_massage.cmd.manage.backend.worker',
  //   queueOptions: {
  //     messageTtl: 1000,
  //   },
  // })
  // public async manageScheduleMessage(
  //   data: any,
  //   consumeMessage: ConsumeMessage,
  // ): Promise<any> {
  //   //* Create
  //   if (consumeMessage.fields.routingKey.indexOf('create') > 0) {
  //     try {
  //       const newCron = data.request.cronExpression.replace('?', '*');
  //       const date = new Date(data.request.specifiedDate);
  //       if (data.request.isCronExpression) {
  //         const schedule: ScheduleDto = {
  //           type: ScheduleType.CRON,
  //           specifiedDate: null,
  //           cronExpression: newCron,
  //           jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
  //           data: {
  //             scheduleMessageId: data.request.scheduleMessageId,
  //           },
  //         };
  //         await this.addScheduleMessage(schedule);
  //         return true;
  //       } else {
  //         const schedule: ScheduleDto = {
  //           type: ScheduleType.DATE,
  //           specifiedDate: date,
  //           cronExpression: '',
  //           jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
  //           data: {
  //             scheduleMessageId: data.request.scheduleMessageId,
  //           },
  //         };
  //         await this.addScheduleMessage(schedule);
  //         return true;
  //       }
  //     } catch (error) {
  //       return error;
  //     }
  //   }
  //   //* Stop
  //   if (consumeMessage.fields.routingKey.indexOf('stop') > 0) {
  //     const schedule: ScheduleDto = {
  //       type: ScheduleType.CRON,
  //       specifiedDate: null,
  //       cronExpression: '*/20 * * * * *',
  //       jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
  //       data: {
  //         scheduleMessageId: data.request,
  //       },
  //     };
  //     const response = await this.stopScheduleMessage(schedule);
  //     return response;
  //   }
  //   //* Pause
  //   if (consumeMessage.fields.routingKey.indexOf('pause') > 0) {
  //     try {
  //       const schedule: ScheduleDto = {
  //         type: ScheduleType.CRON,
  //         specifiedDate: null,
  //         cronExpression: '*/20 * * * * *',
  //         jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
  //         data: {
  //           scheduleMessageId: data.request,
  //         },
  //       };
  //       const payload = await this.pauseQueueRunning(schedule);
  //       return payload;
  //     } catch (error) {
  //       return error;
  //     }
  //   }
  //   //* Resume
  //   if (consumeMessage.fields.routingKey.indexOf('resume') > 0) {
  //     try {
  //       return await this.resumeScheduleMessage(
  //         data.request.scheduleMessageId,
  //         data.request.sendMessageDataList,
  //       );
  //     } catch (error) {
  //       return error;
  //     }
  //   }
  //   //* Update
  //   if (consumeMessage.fields.routingKey.indexOf('update') > 0) {
  //     const newCron = data.request.cronExpression.replace('?', '*');
  //     const date = new Date(data.request.specifiedDate);
  //     if (data.request.isCronExpression) {
  //       const schedule: ScheduleDto = {
  //         type: ScheduleType.CRON,
  //         specifiedDate: null,
  //         cronExpression: newCron,
  //         jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
  //         data: {
  //           scheduleMessageId: data.request.scheduleMessageId,
  //         },
  //       };
  //       return this.updateSchedule(schedule);
  //     } else {
  //       const schedule: ScheduleDto = {
  //         type: ScheduleType.DATE,
  //         specifiedDate: date,
  //         cronExpression: '',
  //         jobType: ScheduleJobType.SEND_SCHEDULE_MESSAGE,
  //         data: {
  //           scheduleMessageId: data.request.scheduleMessageId,
  //         },
  //       };
  //       return this.updateSchedule(schedule);
  //     }
  //   }
  // }
  //#endregion
}
