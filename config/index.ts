import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

const schema = Joi.object({
  // DB config
  DB_HOST: Joi.string().required().description('Primary database host'),
  DB_PORT: Joi.number().default(3306).description('Primary database port'),
  DB_SSL: Joi.boolean()
    .default(false)
    .description('Use SSL for primary database connection'),
  DB_USER: Joi.string().required().description('Primary database user'),
  DB_PASSWORD: Joi.string()
    .optional()
    .allow('')
    .description('Primary database password'),
  DB_NAME: Joi.string().required().description('Primary database name'),
  // Auth config
  JWT_SECRET_KEY: Joi.string().required().description('Auth JWT secret key'),
  JWT_REFRESH_TOKEN_TTL: Joi.number()
    .required()
    .description('Auth JWT refresh token TTL (in seconds)'),
  JWT_ACCESS_TOKEN_TTL: Joi.number()
    .required()
    .description('Auth JWT access token TTL (in seconds)'),
  // Redis config
  REDIS_DB_HOST: Joi.string().required().description('Redis database host'),
  REDIS_DB_PASSWORD: Joi.string()
    .optional()
    .allow('')
    .description('Redis database password'),
  REDIS_DB_INDEX: Joi.number().default(0).description('Redis database index'),
  REDIS_DB_PORT: Joi.number().default(6379).description('Redis database port'),
  // Mail config
  MAIL_HOST: Joi.string().required().description('Mail provider host'),
  MAIL_PORT: Joi.number().required().description('Mail provider port'),
  MAIL_SECURE: Joi.boolean()
    .default(false)
    .description(
      'Mail provider secure, if set to secure, mail messages will be encrypted.',
    ),
  MAIL_USERNAME: Joi.string()
    .optional()
    .allow('')
    .description('Mail provider username'),
  MAIL_PASSWORD: Joi.string()
    .optional()
    .allow('')
    .description('Mail provider password'),
  MAIL_FROM: Joi.string()
    .required()
    .description(
      'Mail from address for transaction emails such as password reset and email confirmation',
    ),
  MAIL_TOKEN_EXPIRATION_TIME: Joi.number()
    .required()
    .description('Mail token expiration time (in seconds)'),
  MAIL_TOKEN_SECRET: Joi.string().required(),
  MAIL_CONFIRMATION_BASE_URL: Joi.string()
    .required()
    .description('Mail confirmation base URL'),
  MAIL_PASSWORD_RESET_BASE_URL: Joi.string()
    .required()
    .description('Mail password reset base URL'),
  // Sentry config
  SENTRY_DSN: Joi.string().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().default('local'),
});

const config: ConfigModuleOptions = {
  envFilePath: process.env.NODE_ENV
    ? [
        `${process.cwd()}/config/env/.env.${process.env.NODE_ENV}.local`,
        `${process.cwd()}/config/env/.env.${process.env.NODE_ENV}`,
      ]
    : [
        `${process.cwd()}/config/env/.env.development.local`,
        `${process.cwd()}/config/env/.env.development`,
      ],
  isGlobal: true,
  cache: true,
  validationSchema: schema,
};

export default config;
