import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LandingService } from '@/landing/landing.service';
import {
  AdminLandingController,
  LandingController,
} from '@/landing/landing.controller';
import { AdminGuard } from '@/admin/admin.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LandingController, AdminLandingController],
  providers: [LandingService, AdminGuard],
  exports: [LandingService],
})
export class LandingModule {}
