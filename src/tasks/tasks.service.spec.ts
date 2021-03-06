import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { TasksService } from './tasks.service';

describe(TasksService, () => {
  let service: TasksService;
  let refreshTokenCreateQueryBuilder: any;
  let refreshTokenRepository: Repository<RefreshToken>;

  beforeEach(async () => {
    refreshTokenCreateQueryBuilder = {
      delete: jest
        .fn()
        .mockImplementation(() => refreshTokenCreateQueryBuilder),
      where: jest.fn().mockImplementation(() => refreshTokenCreateQueryBuilder),
      andWhere: jest
        .fn()
        .mockImplementation(() => refreshTokenCreateQueryBuilder),
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => refreshTokenCreateQueryBuilder),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
  });

  describe('cleanupExpiredRefreshTokens()', () => {
    it('should delete expired refresh tokens', async () => {
      expect(await service.cleanupExpiredRefreshTokens());

      expect(refreshTokenRepository.createQueryBuilder).toHaveBeenCalled();
      expect(refreshTokenCreateQueryBuilder.delete).toHaveBeenCalled();
      expect(refreshTokenCreateQueryBuilder.where).toHaveBeenCalledWith(
        'refresh_tokens.expires <= :currentDate',
        { currentDate: expect.any(Date) },
      );
      expect(refreshTokenCreateQueryBuilder.execute).toHaveBeenCalled();
    });
  });
});
