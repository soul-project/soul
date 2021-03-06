import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import * as factories from 'factories';
import { UsersService } from 'src/users/users.service';
import { UserRole } from 'src/roles/role.enum';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';

import { Platform } from '../entities/platform.entity';
import { PlatformUser } from '../entities/platform-user.entity';
import { PlatformCategory } from '../entities/platform-category.entity';
import { PlatformsService } from '../platforms.service';
import {
  DuplicatePlatformUserException,
  MaxAdminRolesPerUserException,
  PlatformUserNotFoundException,
} from '../exceptions';

import {
  platformCreateQueryBuilderObject,
  platformUserCreateQueryBuilderObject,
} from './utils';

describe('PlatformsService - Users', () => {
  let service: PlatformsService;
  let platformUserRepository: Repository<PlatformUser>;
  let refreshTokenRepository: Repository<RefreshToken>;
  let platformCreateQueryBuilder: any;
  let platformUserCreateQueryBuilder: any;

  beforeEach(async () => {
    platformCreateQueryBuilder = platformCreateQueryBuilderObject;
    platformUserCreateQueryBuilder = platformUserCreateQueryBuilderObject;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlatformsService,
        {
          provide: getRepositoryToken(Platform),
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            findAndCount: jest
              .fn()
              .mockResolvedValue([
                factories.platformArray.build(),
                factories.platformArray.build().length,
              ]),
            save: jest.fn().mockResolvedValue(factories.onePlatform.build()),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => platformCreateQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(PlatformCategory),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.onePlatformCategory.build()),
          },
        },
        {
          provide: getRepositoryToken(PlatformUser),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.onePlatformUser.build()),
            findAndCount: jest.fn(),
            save: jest
              .fn()
              .mockResolvedValue(
                factories.onePlatformUser.build({ roles: [UserRole.Member] }),
              ),
            update: jest.fn(),
            delete: jest.fn(),
            createQueryBuilder: jest
              .fn()
              .mockImplementation(() => platformUserCreateQueryBuilder),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: {
            findOne: jest
              .fn()
              .mockResolvedValue(factories.refreshToken.build()),
            update: jest.fn(),
          },
        },

        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(factories.oneUser.build()),
          },
        },
      ],
    }).compile();

    service = module.get<PlatformsService>(PlatformsService);
    platformUserRepository = module.get<Repository<PlatformUser>>(
      getRepositoryToken(PlatformUser),
    );
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
  });

  describe('findOnePlatformUser()', () => {
    it('should return one platform user successfully', async () => {
      const platformUser = factories.onePlatformUser.build();
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      expect(await service.findOnePlatformUser(platform.id, user.id)).toEqual(
        platformUser,
      );

      expect(platformUserRepository.findOne).toHaveBeenCalledWith({
        user,
        platform,
      });
    });

    it('should throw not found error', async () => {
      jest.spyOn(platformUserRepository, 'findOne').mockResolvedValue(null);
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      await expect(
        async () => await service.findOnePlatformUser(platform.id, user.id),
      ).rejects.toThrow(
        new PlatformUserNotFoundException({
          username: user.userHandle,
          platformName: platform.nameHandle,
        }),
      );
    });
  });

  describe('setUserRole()', () => {
    it('should set platform user role successfully', async () => {
      const platformUser = factories.onePlatformUser.build();
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      await service.setUserRole(platform.id, user.id, [
        UserRole.Admin,
        UserRole.Member,
      ]);

      expect(platformUserRepository.save).toHaveBeenCalledWith(platformUser);
      expect(refreshTokenRepository.findOne).toHaveBeenCalledWith({
        platformUser,
      });
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { platformUser },
        { isRevoked: true },
      );
    });

    it('should throw an error when user has too many admin roles', async () => {
      jest
        .spyOn(platformUserCreateQueryBuilder, 'getCount')
        .mockResolvedValue(6);
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      await expect(
        service.setUserRole(platform.id, user.id, [
          UserRole.Admin,
          UserRole.Member,
        ]),
      ).rejects.toThrow(new MaxAdminRolesPerUserException({ max: 5 }));
      expect(platformUserRepository.save).not.toHaveBeenCalled();
    });

    it('should not throw an error when setting user to member', async () => {
      jest
        .spyOn(platformUserCreateQueryBuilder, 'getCount')
        .mockResolvedValue(6);
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      await expect(
        service.setUserRole(platform.id, user.id, [UserRole.Member]),
      ).resolves.not.toThrow(new MaxAdminRolesPerUserException({ max: 5 }));
      expect(platformUserRepository.save).toHaveBeenCalled();
    });
  });

  describe('removeUser()', () => {
    it('should delete user successfully', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      await service.removeUser(platform.id, user.id);

      expect(service.findOnePlatformUser).toHaveBeenCalledWith(
        platform.id,
        user.id,
      );
      expect(platformUserRepository.delete).toHaveBeenCalledWith({
        id: platformUser.id,
      });
    });
  });

  describe('findAllPlatformUsers()', () => {
    it('should return all platform users successfully', async () => {
      const platform = factories.onePlatform.build();
      const platformUsers = factories.platformUserArray.build();
      jest
        .spyOn(platformUserRepository, 'findAndCount')
        .mockResolvedValue([platformUsers, platformUsers.length]);

      expect(
        await service.findAllPlatformUsers(platform.id, {
          page: 1,
          numItemsPerPage: 10,
        }),
      ).toEqual({ platformUsers, totalCount: platformUsers.length });

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          id: 'ASC',
        },
        relations: ['user'],
        skip: 0,
        take: 10,
        where: {
          platform,
        },
      });
    });

    it('should return all platform users with pagination successfully', async () => {
      const platform = factories.onePlatform.build();
      const platformUsers = factories.platformUserArray.build();
      jest
        .spyOn(platformUserRepository, 'findAndCount')
        .mockResolvedValue([[platformUsers[0]], platformUsers.length]);

      expect(
        await service.findAllPlatformUsers(platform.id, {
          page: 1,
          numItemsPerPage: 1,
        }),
      ).toEqual({
        platformUsers: [platformUsers[0]],
        totalCount: platformUsers.length,
      });

      expect(platformUserRepository.findAndCount).toHaveBeenCalledWith({
        order: {
          id: 'ASC',
        },
        relations: ['user'],
        skip: 0,
        take: 1,
        where: {
          platform,
        },
      });
    });
  });

  describe('addUser()', () => {
    it('should add user successfully', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();
      const platformUser = factories.onePlatformUser.build();
      jest
        .spyOn(service, 'findOnePlatformUser')
        .mockResolvedValue(platformUser);

      expect(await service.addUser(platform.id, user.id)).toEqual(
        factories.onePlatformUser.build({
          roles: [UserRole.Member],
        }),
      );

      expect(platformUserRepository.save).toHaveBeenCalledWith({
        platform: factories.onePlatform.build(),
        roles: [UserRole.Member],
        user: factories.oneUser.build(),
      });
    });

    it('should raise duplicate error', async () => {
      const platform = factories.onePlatform.build();
      const user = factories.oneUser.build();

      jest
        .spyOn(platformUserRepository, 'save')
        .mockRejectedValue(
          new QueryFailedError('', [], { code: 'ER_DUP_ENTRY' }),
        );

      await expect(service.addUser(platform.id, user.id)).rejects.toThrow(
        new DuplicatePlatformUserException(),
      );
    });
  });
});
