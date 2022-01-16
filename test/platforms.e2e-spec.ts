import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Repository, Connection } from 'typeorm';

import { UserRole } from 'src/roles/role.enum';
import { User } from 'src/users/entities/user.entity';
import { PlatformUser } from 'src/platforms/entities/platform-user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';

import createAppFixture from './create-app-fixture';
import { createUsersAndLogin } from './create-users-and-login';

import * as factories from '../factories';

describe('PlatformsController (e2e)', () => {
  let app: INestApplication;
  let platformUserRepository: Repository<PlatformUser>;
  let platformRepository: Repository<Platform>;

  let userAccount: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };

  let secondUserAccount: {
    accessToken: string;
    refreshToken: string;
    user: User;
  };

  beforeAll(async () => {
    app = await createAppFixture({});
    await app.init();

    const connection = app.get(Connection);
    await connection.synchronize(true);

    platformUserRepository = connection.getRepository(PlatformUser);
    platformRepository = connection.getRepository(Platform);

    const { firstUser, secondUser } = await createUsersAndLogin(app);
    userAccount = firstUser;
    secondUserAccount = secondUser;
  });

  afterAll((done) => {
    app.close().then(done);
  });

  describe('/platforms (POST)', () => {
    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('creates a new platform', async () => {
      const createPlatformDto = factories.createPlatformDto.build({
        hostUrl: 'https://example.com',
      });

      await request(app.getHttpServer())
        .post('/platforms')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('Host', 'localhost:3000')
        .send(createPlatformDto)
        .expect(201)
        .expect((res) =>
          expect(res.body).toEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            id: expect.any(Number),
            nameHandle: expect.any(String),
            hostUrl: 'https://example.com',
            name: 'TEST_PLATFORM',
          }),
        );

      const platformUser = await platformUserRepository.findOne({
        user: userAccount.user,
      });
      expect(platformUser).toBeDefined();
      expect(platformUser.roles).toEqual([UserRole.ADMIN, UserRole.MEMBER]);
    });

    it('throws when user is not logged in', async () => {
      const createPlatformDto = factories.createPlatformDto.build({
        hostUrl: 'https://example.com',
      });

      await request(app.getHttpServer())
        .post('/platforms')
        .send(createPlatformDto)
        .expect(401)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'UNAUTHORIZED_ERROR',
            message: 'Unauthorized',
          }),
        );
    });
  });

  describe('/platforms (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save([
        factories.onePlatform.build(),
        factories.onePlatform.build({
          id: 2,
          name: 'TEST_PLATFORM_2',
          nameHandle: 'TEST_PLATFORM_2#2',
        }),
      ]);
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches all platforms', async () => {
      await request(app.getHttpServer())
        .get('/platforms')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                nameHandle: 'TEST_PLATFORM#1',
              },
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM_2',
                nameHandle: 'TEST_PLATFORM_2#2',
              },
            ],
            totalCount: 2,
          }),
        );
    });

    it('paginates correctly', async () => {
      await request(app.getHttpServer())
        .get('/platforms?numItemsPerPage=1&page=1')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            platforms: [
              {
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
                hostUrl: 'TEST_HOST_URL',
                id: expect.any(Number),
                name: 'TEST_PLATFORM',
                nameHandle: 'TEST_PLATFORM#1',
              },
            ],
            totalCount: 2,
          }),
        );
    });
  });

  describe('/platforms/:id (GET)', () => {
    beforeAll(async () => {
      await platformRepository.save(factories.onePlatform.build());
    });

    afterAll(async () => {
      await platformRepository.delete({});
    });

    it('fetches a platform by id', async () => {
      await request(app.getHttpServer())
        .get('/platforms/1')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            hostUrl: 'TEST_HOST_URL',
            id: expect.any(Number),
            name: 'TEST_PLATFORM',
            nameHandle: 'TEST_PLATFORM#1',
          }),
        );
    });

    it('throws not found', async () => {
      await request(app.getHttpServer())
        .get('/platforms/999')
        .expect(404)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PLATFORM_NOT_FOUND',
            message:
              'The platform with id: 999 was not found, please try again.',
          }),
        );
    });
  });

  describe('/platforms/:id (PATCH)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build(),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          user: userAccount.user,
          platform,
        }),
      );
    });

    afterEach(async () => {
      await platformRepository.delete({});
    });

    it('updates existing platform', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
            hostUrl: 'TEST_HOST_URL',
            id: 1,
            name: 'TEST_PLATFORM_2',
            nameHandle: 'TEST_PLATFORM_2#1',
          }),
        );
    });

    it('throws when insufficient permissions', async () => {
      await request(app.getHttpServer())
        .patch('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('Host', 'localhost:3000')
        .send({ name: 'TEST_PLATFORM_2' })
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:id (DELETE)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build(),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          user: userAccount.user,
          platform,
        }),
      );
    });

    it('deletes existing platform', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws insufficient permissions', async () => {
      await request(app.getHttpServer())
        .delete('/platforms/1')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:id/users (GET)', () => {
    beforeAll(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build(),
      );
      await platformUserRepository.save(
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
      );
    });

    afterAll(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('fetches all users within a platform', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .get('/platforms/1/users')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            totalCount: 1,
            platformUsers: [
              {
                id: 1,
                roles: [UserRole.ADMIN, UserRole.MEMBER],
                user: {
                  id: 1,
                  userHandle: 'TEST_USER#1',
                  username: 'TEST_USER',
                },
              },
            ],
          }),
        );
    });

    it('throws due to insufficient permissions', async () => {
      await request(app.getHttpServer())
        .get('/platforms/1/users')
        .set('Authorization', `Bearer ${userAccount.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:id/users/:userId (PUT)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build(),
      );
      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.MEMBER],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('sets user role', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/2?roles=admin,member')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) =>
          expect(res.body).toEqual({
            id: 2,
            platform: {
              createdAt: expect.any(String),
              updatedAt: expect.any(String),
              hostUrl: 'TEST_HOST_URL',
              id: 1,
              name: 'TEST_PLATFORM',
              nameHandle: 'TEST_PLATFORM#1',
            },
            roles: [UserRole.ADMIN, UserRole.MEMBER],
            user: {
              id: 2,
              userHandle: 'TEST_USER_2#2',
              username: 'TEST_USER_2',
            },
          }),
        );
    });

    it('throws an error when trying to set only remaining admin to member', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/1?roles=member')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'NO_ADMINS_REMAINING',
            message:
              'It seems like you might be the last admin of this platform. You need to appoint another admin before performing this action.',
          }),
        );
    });

    it('throws with insufficient permissions', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .put('/platforms/1/users/1?roles=admin,member')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:id/users/:userId (DELETE)', () => {
    beforeEach(async () => {
      const platform = await platformRepository.save(
        factories.onePlatform.build(),
      );
      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.MEMBER],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('deletes a platform user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/2')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('throws due to insufficient permissions', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .delete('/platforms/1/users/1')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'PERMISSION_DENIED',
            message:
              'You lack the permissions necessary to perform this action.',
          }),
        );
    });
  });

  describe('/platforms/:platformId/quit (DELETE)', () => {
    let platform: Platform;

    beforeEach(async () => {
      platform = await platformRepository.save(factories.onePlatform.build());

      await platformUserRepository.save([
        factories.onePlatformUser.build({ user: userAccount.user, platform }),
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.MEMBER],
        }),
      ]);
    });

    afterEach(async () => {
      await platformUserRepository.delete({});
      await platformRepository.delete({});
    });

    it('quits existing platform (ADMIN)', async () => {
      await platformUserRepository.save(
        factories.onePlatformUser.build({
          id: 2,
          user: secondUserAccount.user,
          platform,
          roles: [UserRole.ADMIN, UserRole.MEMBER],
        }),
      );
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('quits existing platform (MEMBER)', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER_2@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(200)
        .expect((res) => expect(res.body).toEqual({}));
    });

    it('only remaining admin cant quit', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login?platformId=1')
        .send({ email: 'TEST_USER@EMAIL.COM', password: 'TEST_PASSWORD' });

      await request(app.getHttpServer())
        .delete('/platforms/1/quit')
        .set('Authorization', `Bearer ${response.body.accessToken}`)
        .set('Host', 'localhost:3000')
        .expect(403)
        .expect((res) =>
          expect(res.body).toEqual({
            error: 'NO_ADMINS_REMAINING',
            message:
              'It seems like you might be the last admin of this platform. You need to ' +
              'appoint another admin before performing this action.',
          }),
        );
    });
  });
});
