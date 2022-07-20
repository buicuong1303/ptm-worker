/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BaseEntity,
  PrimaryGeneratedColumn,
  Column,
  Entity,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { EntityStatus } from 'src/common/constant/entity-status';
import { ScheduleExecutionStatus } from './../enum/schedule-status.type';
import { Schedule } from './schedule.entity';

@Entity({ name: 'schedule_executions' })
export class ScheduleExecution extends BaseEntity {
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

  @Column({ nullable: true })
  executionStatus: ScheduleExecutionStatus;

  @ManyToOne((type) => Schedule, (schedule) => schedule.scheduleExecution)
  schedule: Schedule;
}
