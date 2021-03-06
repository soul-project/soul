import { MailerService } from '@nestjs-modules/mailer';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bull';
import { plainToClass } from 'class-transformer';
import * as Sentry from '@sentry/node';

import { User } from 'src/users/entities/user.entity';

@Processor('mail_queue')
export class MailProcessor {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private readonly mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.debug(
      `Processing job ${job.id} of type ${job.name}. Data: ${JSON.stringify(
        job.data,
      )}`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.debug(`Completed job ${job.id} of type ${job.name}.`);
  }

  @OnQueueFailed()
  onError(job: Job<any>, error: any) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
    Sentry.captureException(error);
  }

  @Process('confirmation')
  async sendConfirmationEmail(job: Job<{ user: User; code: string }>) {
    this.logger.log(`Sending confirmation email to '${job.data.user.email}'`);
    try {
      await this.mailerService.sendMail({
        template: 'confirmation',
        context: {
          ...plainToClass(User, job.data.user),
          url: `${this.configService.get('MAIL_CONFIRMATION_BASE_URL')}?token=${
            job.data.code
          }`,
        },
        subject: 'Complete your soul profile',
        to: job.data.user.email,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send confirmation email to '${job.data.user.email}'`,
      );
      throw error;
    }
  }

  @Process('password_reset')
  async sendPasswordResetEmail(job: Job<{ user: User; code: string }>) {
    this.logger.log(`Sending password reset email to '${job.data.user.email}'`);
    try {
      await this.mailerService.sendMail({
        template: 'password-reset',
        context: {
          ...plainToClass(User, job.data.user),
          url: `${this.configService.get(
            'MAIL_PASSWORD_RESET_BASE_URL',
          )}?token=${job.data.code}`,
        },
        subject: 'Reset password',
        to: job.data.user.email,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to '${job.data.user.email}'`,
      );
      throw error;
    }
  }
}
