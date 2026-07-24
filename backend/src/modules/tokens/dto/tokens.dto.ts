import {
  IsBoolean,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

const GITHUB_USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export class RegisterTokenDto {
  @IsNotEmpty()
  @IsString()
  @Matches(GITHUB_USERNAME_PATTERN, {
    message: 'username must be a valid GitHub username.',
  })
  username!: string;

  @IsNotEmpty()
  @IsString()
  token!: string;

  @IsBoolean()
  consentAccepted!: boolean;

  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: 'es' | 'en';
}

export class RevokeTokenDto {
  @IsNotEmpty()
  @IsString()
  @Matches(GITHUB_USERNAME_PATTERN, {
    message: 'username must be a valid GitHub username.',
  })
  username!: string;

  /**
   * Token can be provided in the request body.
   * The Authorization header is the preferred method.
   */
  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: 'es' | 'en';
}

export class PurgeUserDto {
  @IsNotEmpty()
  @IsString()
  @Matches(GITHUB_USERNAME_PATTERN, {
    message: 'username must be a valid GitHub username.',
  })
  username!: string;

  /**
   * Token used to verify ownership before purging all user data.
   * The Authorization header is the preferred method.
   */
  @IsOptional()
  @IsString()
  token?: string;

  @IsOptional()
  @IsIn(['es', 'en'])
  locale?: 'es' | 'en';
}
