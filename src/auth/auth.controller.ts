import {
  Controller,
  Request,
  Post,
  UseGuards,
  Query,
  Body,
  Header,
  HttpStatus,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { User } from 'src/users/entities/user.entity';

import { AuthService } from './auth.service';
import {
  CodeResponseDto,
  LoginResponseDto,
  PlatformLoginResponseDto,
  RefreshTokenResponseDto,
  RefreshTokenWithPlatformResponseDto,
} from './dto/api-responses.dto';
import {
  PlatformIdQueryDto,
  RefreshTokenBodyDto,
  CodeQueryParamDto,
  VerifyQueryParamDto,
} from './dto/api.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@Controller({ version: '1', path: 'auth' })
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiExcludeEndpoint()
  @ApiOperation({ description: 'Login with email and password' })
  @ApiResponse({ status: HttpStatus.CREATED, type: LoginResponseDto })
  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('login')
  async login(@Request() { user }: { user: User }): Promise<LoginResponseDto> {
    return new LoginResponseDto(await this.authService.login(user));
  }

  @ApiOperation({
    description:
      'Login with external platform, returns code to be exchanged for a token',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: CodeResponseDto })
  @UseGuards(LocalAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Post('code')
  async code(
    @Request() { user }: { user: User },
    @Query() { platformId, callback }: CodeQueryParamDto,
  ): Promise<CodeResponseDto> {
    return new CodeResponseDto(
      await this.authService.getCodeForPlatformAndCallback(
        user,
        platformId,
        callback,
      ),
    );
  }

  @ApiOperation({
    description:
      'Verify code returned to external platform and exchange for access tokens',
  })
  @ApiResponse({ status: HttpStatus.CREATED, type: PlatformLoginResponseDto })
  @Post('verify')
  @Header('Cache-Control', 'no-store')
  async verify(
    @Query() { code, callback, state }: VerifyQueryParamDto,
  ): Promise<PlatformLoginResponseDto> {
    return new PlatformLoginResponseDto(
      await this.authService.exchangeCodeForToken({ code, callback, state }),
    );
  }

  @ApiOperation({
    description:
      'Refresh access token, returns new access token. ' +
      'If platformId is provided, returns new access token for that platform',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    type: RefreshTokenWithPlatformResponseDto,
  })
  @Post('refresh')
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Query() { platformId }: PlatformIdQueryDto,
    @Body() { refreshToken }: RefreshTokenBodyDto,
  ): Promise<RefreshTokenWithPlatformResponseDto | RefreshTokenResponseDto> {
    if (platformId) {
      return new RefreshTokenWithPlatformResponseDto(
        await this.authService.refreshWithPlatform(refreshToken, platformId),
      );
    }
    return new RefreshTokenResponseDto(
      await this.authService.refresh(refreshToken),
    );
  }
}
