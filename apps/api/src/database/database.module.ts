import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from '@/database/entities';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url =
          config.get<string>('DATABASE_URL') ||
          'postgresql://hydrorage:hydrorage@localhost:6432/hydrorage';
        return {
          type: 'postgres' as const,
          url,
          entities,
          synchronize: false,
          logging: false,
          // PgBouncer transaction pooling
          extra: {
            max: 10,
          },
        };
      },
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
