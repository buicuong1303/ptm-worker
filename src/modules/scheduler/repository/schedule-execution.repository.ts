import { Repository, EntityRepository } from 'typeorm';
import { ScheduleExecution } from '../entity/schedule-execution.entity';

@EntityRepository(ScheduleExecution)
export class ScheduleExecutionRepository extends Repository<ScheduleExecution> {}
