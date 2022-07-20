import { IsString } from 'class-validator';
import { ScheduleExecution } from 'src/modules/scheduler/entity/schedule-execution.entity';
import { SendMessageJobDataDto } from './send-message-job-data.dto';

export class JobDataDto {
  content: SendMessageJobDataDto;

  @IsString()
  scheduleExecution: ScheduleExecution;

  @IsString()
  scheduleMessageId: string;

  creationTime: Date;

  index: number;

  // message: MessageDto;

  // customFields: any;
}
