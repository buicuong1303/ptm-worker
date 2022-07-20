import { IsString } from 'class-validator';

export class ScheduleMessageRunnerDto {
  @IsString()
  scheduleMessageId: string;

  @IsString()
  scheduleId: string;
}
