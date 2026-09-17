import { Module } from '@nestjs/common';
import { IntakeService } from '@/intake/intake.service';
import { IntakeController } from '@/intake/intake.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [IntakeService],
  controllers: [IntakeController],
  exports: [IntakeService],
})
export class IntakeModule {}
