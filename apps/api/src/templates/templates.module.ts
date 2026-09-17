import { Module } from '@nestjs/common';
import { TemplatesService } from '@/templates/templates.service';
import { TemplatesController } from '@/templates/templates.controller';
import { AuthModule } from '@/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [TemplatesService],
  controllers: [TemplatesController],
  exports: [TemplatesService],
})
export class TemplatesModule {}
