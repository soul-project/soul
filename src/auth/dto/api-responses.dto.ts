import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

import { UserRole } from 'src/roles/role.enum';

export class LoginResponseDto {
  @ApiProperty({ name: 'access_token' })
  @Expose({ name: 'access_token' })
  accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  @Expose({ name: 'refresh_token' })
  refreshToken: string;

  @ApiProperty({ name: 'expires_in' })
  @Expose({ name: 'expires_in' })
  expiresIn: number;

  constructor(args: LoginResponseDto) {
    Object.assign(this, args);
  }
}

export class CodeResponseDto {
  @ApiProperty({ name: 'code' })
  @Expose()
  code: string;

  @ApiProperty({ name: 'state' })
  @Expose()
  state: string;

  constructor(args: CodeResponseDto) {
    Object.assign(this, args);
  }
}

export class PlatformLoginResponseDto extends LoginResponseDto {
  @ApiProperty({ name: 'platform_id', example: 1 })
  @Expose({ name: 'platform_id' })
  platformId: number;

  @ApiProperty({ name: 'roles', example: [UserRole.Admin, UserRole.Member] })
  @Expose()
  roles: UserRole[];

  constructor(args: PlatformLoginResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}

export class RefreshTokenResponseDto {
  @ApiProperty({ name: 'access_token' })
  @Expose({ name: 'access_token' })
  accessToken: string;

  @ApiProperty({ name: 'refresh_token' })
  @Expose({ name: 'refresh_token' })
  refreshToken: string;

  @ApiProperty({ name: 'expires_in' })
  @Expose({ name: 'expires_in' })
  expiresIn: number;

  constructor(args: RefreshTokenResponseDto) {
    Object.assign(this, args);
  }
}

export class RefreshTokenWithPlatformResponseDto extends RefreshTokenResponseDto {
  @ApiProperty({ name: 'platform_id', example: 1 })
  @Expose({ name: 'platform_id' })
  platformId: number;

  @ApiProperty({ name: 'roles', example: [UserRole.Admin, UserRole.Member] })
  @Expose()
  roles: UserRole[];

  constructor(args: RefreshTokenWithPlatformResponseDto) {
    super(args);
    Object.assign(this, args);
  }
}
