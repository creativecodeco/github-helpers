import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { TokensController } from '../src/modules/tokens/tokens.controller';
import { RegisterUserTokenUseCase } from '../src/use-cases/tokens/RegisterUserTokenUseCase';
import { RevokeUserTokenUseCase } from '../src/use-cases/tokens/RevokeUserTokenUseCase';
import { PurgeUserDataUseCase } from '../src/use-cases/users/PurgeUserDataUseCase';
import { RegisterTokenDto, RevokeTokenDto, PurgeUserDto } from '../src/modules/tokens/dto/tokens.dto';

describe('TokensController', () => {
  let controller: TokensController;

  const mockRegisterUseCase = { execute: vi.fn() };
  const mockRevokeUseCase = { execute: vi.fn() };
  const mockPurgeUseCase = { execute: vi.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TokensController],
      providers: [
        { provide: RegisterUserTokenUseCase, useValue: mockRegisterUseCase },
        { provide: RevokeUserTokenUseCase, useValue: mockRevokeUseCase },
        { provide: PurgeUserDataUseCase, useValue: mockPurgeUseCase },
      ],
    }).compile();

    controller = module.get<TokensController>(TokensController);
    vi.clearAllMocks();
  });

  describe('register()', () => {
    it('should throw BadRequestException when consentAccepted is false', async () => {
      const dto: RegisterTokenDto = {
        username: 'testuser',
        token: 'ghp_test',
        consentAccepted: false,
      };

      await expect(controller.register(dto)).rejects.toThrow(BadRequestException);
    });

    it('should call registerUseCase and return result on success', async () => {
      const dto: RegisterTokenDto = {
        username: 'testuser',
        token: 'ghp_test',
        consentAccepted: true,
      };
      const mockResult = { success: true };
      mockRegisterUseCase.execute.mockResolvedValue(mockResult);

      const result = await controller.register(dto, undefined, undefined, '127.0.0.1');

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(
        'testuser', 'ghp_test', true, '127.0.0.1', ''
      );
      expect(result).toEqual(mockResult);
    });

    it('should throw InternalServerErrorException when use case throws', async () => {
      const dto: RegisterTokenDto = {
        username: 'testuser',
        token: 'ghp_test',
        consentAccepted: true,
      };
      mockRegisterUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(controller.register(dto)).rejects.toThrow(InternalServerErrorException);
    });

    it('should use English error messages when locale=en', async () => {
      const dto: RegisterTokenDto = {
        username: 'testuser',
        token: 'ghp_test',
        consentAccepted: false,
        locale: 'en',
      };

      const error = await controller.register(dto).catch((e) => e);
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).message).toBe(
        'You must accept the data storage terms and conditions.'
      );
    });
  });

  describe('revoke()', () => {
    it('should throw BadRequestException when no token is provided', async () => {
      const dto: RevokeTokenDto = { username: 'testuser' };

      await expect(controller.revoke(dto, undefined)).rejects.toThrow(BadRequestException);
    });

    it('should extract Bearer token from Authorization header', async () => {
      const dto: RevokeTokenDto = { username: 'testuser' };
      mockRevokeUseCase.execute.mockResolvedValue({ revoked: true });

      await controller.revoke(dto, 'Bearer ghp_mytoken');

      expect(mockRevokeUseCase.execute).toHaveBeenCalledWith('testuser', 'ghp_mytoken');
    });

    it('should throw InternalServerErrorException when use case throws', async () => {
      const dto: RevokeTokenDto = { username: 'testuser', token: 'ghp_token' };
      mockRevokeUseCase.execute.mockRejectedValue(new Error('DB error'));

      await expect(controller.revoke(dto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('purge()', () => {
    it('should throw BadRequestException when no token is provided', async () => {
      const dto: PurgeUserDto = { username: 'testuser' };

      await expect(controller.purge(dto, undefined)).rejects.toThrow(BadRequestException);
    });

    it('should throw UnauthorizedException when GitHub API rejects the token', async () => {
      const dto: PurgeUserDto = { username: 'testuser', token: 'ghp_invalid' };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }));

      await expect(controller.purge(dto)).rejects.toThrow(UnauthorizedException);

      vi.unstubAllGlobals();
    });

    it('should throw ForbiddenException when token owner does not match target username', async () => {
      const dto: PurgeUserDto = { username: 'targetuser', token: 'ghp_valid' };

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ login: 'otheruser' }),
      }));

      await expect(controller.purge(dto)).rejects.toThrow(ForbiddenException);

      vi.unstubAllGlobals();
    });

    it('should purge and return success message when token owner matches', async () => {
      const dto: PurgeUserDto = { username: 'testuser', token: 'ghp_valid' };
      mockPurgeUseCase.execute.mockResolvedValue(undefined);

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ login: 'testuser' }),
      }));

      const result = await controller.purge(dto);

      expect(result.message).toContain('eliminados');
      expect(mockPurgeUseCase.execute).toHaveBeenCalledWith('testuser');

      vi.unstubAllGlobals();
    });
  });
});
