import { IsOptional } from 'class-validator';
import { ScheduleJobType } from '../enum/schedule-job-type';
import { ScheduleStatus } from '../enum/schedule-status';
import { ScheduleType } from '../enum/schedule.type';

export class ScheduleDto {
  // sendStatus: ScheduleStatus;
  @IsOptional()
  type: ScheduleType; //* timeout | interval | specified_date | cron
  // seconds: number; //* set when type is timeout | interval
  specifiedDate: Date; //* set when type is specified_date
  cronExpression: string;
  jobType: ScheduleJobType;
  data: any;
}
