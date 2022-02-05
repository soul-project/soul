import { Test, TestingModule } from '@nestjs/testing';

import * as factories from 'factories';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserRole } from 'src/roles/role.enum';

describe('AuthService', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
              refreshToken: 'REFRESH_TOKEN',
            }),
            loginWithPlatform: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
              refreshToken: 'REFRESH_TOKEN',
              platformId: 1,
              roles: [UserRole.ADMIN, UserRole.MEMBER],
            }),
            refresh: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
            }),
            refreshWithPlatform: jest.fn().mockResolvedValue({
              accessToken: 'ACCESS_TOKEN',
              platformId: 1,
              roles: [UserRole.ADMIN, UserRole.MEMBER],
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('should return token', async () => {
      const user = factories.oneUser.build();
      const result = await controller.login({ user });

      expect(result).toStrictEqual({
        accessToken: 'ACCESS_TOKEN',
        refreshToken: 'REFRESH_TOKEN',
      });
      expect(service.login).toHaveBeenCalledWith(user);
    });
  });

  describe('refresh()', () => {
    it('should return token', async () => {
      const refreshToken = 'REFRESH_TOKEN';
      const result = await controller.refresh({}, { refreshToken });

      expect(result).toStrictEqual({
        accessToken: 'ACCESS_TOKEN',
      });
      expect(service.refresh).toHaveBeenCalledWith(refreshToken);
    });

    it('should return token with platformId', async () => {
      const refreshToken = 'REFRESH_TOKEN';
      const result = await controller.refresh(
        { platformId: 1 },
        { refreshToken },
      );

      expect(result).toStrictEqual({
        accessToken: 'ACCESS_TOKEN',
        platformId: 1,
        roles: [UserRole.ADMIN, UserRole.MEMBER],
      });
      expect(service.refreshWithPlatform).toHaveBeenCalledWith(refreshToken, 1);
    });
  });
});
