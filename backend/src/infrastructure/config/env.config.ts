import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync
} from 'class-validator';
import { plainToInstance, Type } from 'class-transformer';

class EnvConfigDto {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsNotEmpty()
  @IsString()
  GITHUB_TOKEN!: string;

  @IsNotEmpty()
  @IsString()
  DB_HOST!: string;

  @IsNotEmpty()
  @IsNumber()
  DB_PORT!: number;

  @IsNotEmpty()
  @IsString()
  DB_USERNAME!: string;

  @IsNotEmpty()
  @IsString()
  DB_PASSWORD!: string;

  @IsNotEmpty()
  @IsString()
  DB_DATABASE!: string;

  @IsNotEmpty()
  @IsBoolean()
  DB_SYNCHRONIZE!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  DB_SSL!: boolean;

  @IsNotEmpty()
  @IsString()
  ENCRYPTION_KEY!: string;

  @IsNotEmpty()
  @IsString()
  METRICS_KEY!: string;

  @IsOptional()
  @IsString()
  PRIVATE_STATS_COMING_SOON?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
}

/**
 * Validates all required environment variables at bootstrap time.
 * Throws with a descriptive error message if any required variable is missing or invalid.
 */
export function validateEnvConfig(): void {
  const config = plainToInstance(EnvConfigDto, process.env, {
    enableImplicitConversion: true
  });

  const errors = validateSync(config, { skipMissingProperties: false });

  if (errors.length > 0) {
    const messages = errors
      .map((e) => Object.values(e.constraints ?? {}).join(', '))
      .join('\n  - ');
    throw new Error(`Environment configuration is invalid:\n  - ${messages}`);
  }
}
