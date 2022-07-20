/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EntityStatus } from 'src/common/constant/entity-status';
import { ScheduleType } from '../enum/schedule.type';
import { ScheduleJobType } from '../enum/schedule-job-type';
import { ScheduleExecution } from './schedule-execution.entity';
import { ScheduleStatus } from '../enum/schedule-status';

@Entity({ name: 'schedules' })
export class Schedule extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  creationUserId: string;

  @Column({ default: '' })
  lastModifiedUserId: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creationTime: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  lastModifiedTime: Date;

  @Column({ default: EntityStatus.ACTIVE })
  status: EntityStatus;

  // @Column({ nullable: false })
  // name: string;

  // @Column({ default: '' })
  // desc: string;

  @Column({ nullable: false })
  type: ScheduleType; //* timeout | interval | specified_date | cron

  // @Column({ nullable: true })
  // seconds: number; //* set when type is timeout | interval

  @Column({ type: 'timestamptz', nullable: true })
  specifiedDate: Date; //* set when type is specified_date

  @Column({ nullable: false })
  sendStatus: ScheduleStatus;

  @Column({ nullable: true })
  cronExpression: string;

  @Column({ nullable: false })
  jobType: ScheduleJobType;

  @Column({ type: 'jsonb' })
  data: any;

  @OneToMany(
    (type) => ScheduleExecution,
    (scheduleExecution) => {
      scheduleExecution.schedule;
    },
  )
  scheduleExecution: ScheduleExecution[];
}
