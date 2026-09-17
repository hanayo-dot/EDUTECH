import { Module } from '@nestjs/common';
import { TimetablingController } from './timetabling.controller';
import { TimetablingService } from './timetabling.service';
import { DatabaseModule } from '../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [TimetablingController],
  providers: [TimetablingService],
  exports: [TimetablingService],
})
export class TimetablingModule {}
