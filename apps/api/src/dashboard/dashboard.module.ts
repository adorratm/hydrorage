import { Module } from '@nestjs/common';
import { DashboardService } from '@/dashboard/dashboard.service';
import { DashboardController } from '@/dashboard/dashboard.controller';
import { AuthModule } from '@/auth/auth.module';
import { IntakeModule } from '@/intake/intake.module';

@Module({
  imports: [AuthModule, IntakeModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
