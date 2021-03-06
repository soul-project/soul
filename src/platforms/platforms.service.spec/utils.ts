import * as factories from 'factories';

export const platformCreateQueryBuilderObject = {
  select: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  where: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  andWhere: jest
    .fn()
    .mockImplementation(() => platformCreateQueryBuilderObject),
  orderBy: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  skip: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  take: jest.fn().mockImplementation(() => platformCreateQueryBuilderObject),
  leftJoinAndSelect: jest
    .fn()
    .mockImplementation(() => platformCreateQueryBuilderObject),
  getManyAndCount: jest
    .fn()
    .mockResolvedValue([
      factories.platformArray.build(),
      factories.platformArray.build().length,
    ]),
};

export const platformUserCreateQueryBuilderObject = {
  select: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  where: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  andWhere: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  leftJoinAndSelect: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  skip: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  take: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  orderBy: jest
    .fn()
    .mockImplementation(() => platformUserCreateQueryBuilderObject),
  getOne: jest.fn().mockResolvedValue(factories.onePlatformUser.build()),
  getCount: jest.fn().mockResolvedValue(1),
  getManyAndCount: jest
    .fn()
    .mockResolvedValue([[factories.onePlatformUser.build()], 1]),
};
