import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@/database/database.module';
import { RedisModule } from '@/redis/redis.module';
import { RealtimeModule } from '@/realtime/realtime.module';
import { QueueModule } from '@/queue/queue.module';
import { AuthModule } from '@/auth/auth.module';
import { UsersModule } from '@/users/users.module';
import { IntakeModule } from '@/intake/intake.module';
import { CharactersModule } from '@/characters/characters.module';
import { TemplatesModule } from '@/templates/templates.module';
import { SettingsModule } from '@/settings/settings.module';
import { RoutinesModule } from '@/routines/routines.module';
import { ThreatsModule } from '@/threats/threats.module';
import { StatsModule } from '@/stats/stats.module';
import { DashboardModule } from '@/dashboard/dashboard.module';
import { AdminModule } from '@/admin/admin.module';
import { LandingModule } from '@/landing/landing.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    RedisModule,
    RealtimeModule,
    QueueModule,
    AuthModule,
    UsersModule,
    IntakeModule,
    CharactersModule,
    TemplatesModule,
    SettingsModule,
    RoutinesModule,
    ThreatsModule,
    StatsModule,
    DashboardModule,
    AdminModule,
    LandingModule,
  ],
})
export class AppModule {}
