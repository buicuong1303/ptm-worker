import { IsString } from 'class-validator';
import { MessageDto } from 'src/common/dto/message.dto';

export class SendMessageJobDataDto {
  @IsString()
  scheduleMessageId: string;

  @IsString()
  scheduleSetId: string;

  // message: MessageDto;

  // customFields: any;
}
