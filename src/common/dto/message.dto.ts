import { AttachmentDto } from './attachment.dto';

export class MessageDto {
  text: string;
  attachments: AttachmentDto[];
  phoneFrom: string;
  phoneTo: string;
  id: string;

  exId?: string;
  exMessageStatus?: string; //* Sent | SentFailed | Delivered | DeliveredFailed | Queue | Received
  exCreationTime?: any;
  exLastModifiedTime?: any;
}
