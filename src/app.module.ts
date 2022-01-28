import { Module, HttpException } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { RavenInterceptor, RavenModule } from 'nest-raven';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';

import { User } from './users/entities/user.entity';
import { RefreshToken } from './auth/entities/refresh-token.entity';
import { AuthModule } from './auth/auth.module';
import { PlatformsModule } from './platforms/platforms.module';
import { Platform } from './platforms/entities/platform.entity';
import { PlatformUser } from './platforms/entities/platform-user.entity';
import { UserConnectionsModule } from './user-connections/user-connections.module';
import { UserConnection } from './user-connections/entities/user-connection.entity';
import { AllExceptionFilter } from './filters/all-exception.filter';
import { MailModule } from './mail/mail.module';

import config from '../config';

@Module({
  imports: [
    ConfigModule.forRoot(config),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USER'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, RefreshToken, Platform, PlatformUser, UserConnection],
        // timezone: 'Z', // TODO: See if this works
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PlatformsModule,
    UserConnectionsModule,
    MailModule,
    RavenModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor({
        filters: [
          {
            type: HttpException,
            filter: (exception: HttpException) => 500 > exception.getStatus(),
          },
        ],
      }),
    },
  ],
})
export class AppModule {}
