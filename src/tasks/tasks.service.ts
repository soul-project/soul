import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}
  private readonly logger = new Logger(TasksService.name);

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredRefreshTokens() {
    this.logger.debug('Deleting expired refresh tokens...');
    await this.refreshTokenRepository
      .createQueryBuilder('refresh_tokens')
      .delete()
      .where('refresh_tokens.expires <= :currentDate', {
        currentDate: new Date(),
      })
      .execute();

    this.logger.debug('Deleted all expired refresh tokens');
  }
}
