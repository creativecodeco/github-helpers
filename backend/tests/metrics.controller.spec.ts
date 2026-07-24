import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { MetricsController } from '../src/modules/metrics/metrics.controller';
import { IMetricsRepository } from '../src/domain/repositories/IMetricsRepository';
import { MetricsHistoryQueryDto, MetricsKeyQueryDto } from '../src/modules/metrics/dto/metrics.dto';

const VALID_KEY = 'test-metrics-key-123';

describe('MetricsController', () => {
  let controller: MetricsController;

  const mockMetricsRepo: IMetricsRepository = {
    recordHit: vi.fn(),
    getMetrics: vi.fn().mockReturnValue({ totalRenders: 42 }),
    getUserMetrics: vi.fn(),
    getAllUserMetrics: vi.fn().mockResolvedValue([]),
    getUniqueUsersCount: vi.fn().mockResolvedValue(5),
    getOrIncrementProfileViews: vi.fn(),
    getRendersHistory: vi.fn().mockResolvedValue([{ date: '2026-07-24', count: 10 }]),
  };

  beforeEach(async () => {
    process.env.METRICS_KEY = VALID_KEY;
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        { provide: 'IMetricsRepository', useValue: mockMetricsRepo },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
  });

  describe('validateMetricsKey (via getMetrics)', () => {
    it('should throw ForbiddenException when METRICS_KEY env is not set', () => {
      delete process.env.METRICS_KEY;
      const query: MetricsKeyQueryDto = { key: 'any-key' };

      expect(() => controller.getMetrics(query)).toThrow(ForbiddenException);
    });

    it('should throw UnauthorizedException when key is missing', () => {
      const query: MetricsKeyQueryDto = {};

      expect(() => controller.getMetrics(query)).toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when key is incorrect', () => {
      const query: MetricsKeyQueryDto = { key: 'wrong-key' };

      expect(() => controller.getMetrics(query)).toThrow(UnauthorizedException);
    });

    it('should accept key from x-api-key header', () => {
      const query: MetricsKeyQueryDto = {};

      const result = controller.getMetrics(query, VALID_KEY);

      expect(result).toEqual({ totalRenders: 42 });
    });

    it('should accept key from query parameter', () => {
      const query: MetricsKeyQueryDto = { key: VALID_KEY };

      const result = controller.getMetrics(query);

      expect(result).toEqual({ totalRenders: 42 });
    });

    it('should prefer x-api-key header over query key', () => {
      const query: MetricsKeyQueryDto = { key: 'wrong-key' };

      // Header has priority — wrong query key should be ignored
      const result = controller.getMetrics(query, VALID_KEY);
      expect(result).toEqual({ totalRenders: 42 });
    });
  });

  describe('getRendersHistory()', () => {
    it('should return history data with valid key and default days', async () => {
      const query: MetricsHistoryQueryDto = { key: VALID_KEY };

      const result = await controller.getRendersHistory(query);

      expect(mockMetricsRepo.getRendersHistory).toHaveBeenCalledWith(7);
      expect(result).toEqual([{ date: '2026-07-24', count: 10 }]);
    });

    it('should pass custom days to repository', async () => {
      const query: MetricsHistoryQueryDto = { key: VALID_KEY, days: 30 };

      await controller.getRendersHistory(query);

      expect(mockMetricsRepo.getRendersHistory).toHaveBeenCalledWith(30);
    });

    it('should throw InternalServerErrorException when repository throws', async () => {
      const query: MetricsHistoryQueryDto = { key: VALID_KEY };
      vi.mocked(mockMetricsRepo.getRendersHistory).mockRejectedValue(new Error('DB error'));

      await expect(controller.getRendersHistory(query)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getUserMetrics()', () => {
    it('should return user metrics with valid key', async () => {
      const query: MetricsKeyQueryDto = { key: VALID_KEY };
      vi.mocked(mockMetricsRepo.getAllUserMetrics).mockResolvedValue([{ username: 'testuser' }]);

      const result = await controller.getUserMetrics(query);

      expect(result).toEqual([{ username: 'testuser' }]);
    });
  });

  describe('getUniqueUsersCount()', () => {
    it('should return user count without authentication', async () => {
      const result = await controller.getUniqueUsersCount();

      expect(result).toBe(5);
    });

    it('should throw InternalServerErrorException when repository throws', async () => {
      vi.mocked(mockMetricsRepo.getUniqueUsersCount).mockRejectedValue(new Error('DB error'));

      await expect(controller.getUniqueUsersCount()).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('getConfig()', () => {
    it('should return privateStatsComingSoon as true by default', () => {
      delete process.env.PRIVATE_STATS_COMING_SOON;

      const result = controller.getConfig();

      expect(result.privateStatsComingSoon).toBe(true);
    });

    it('should return privateStatsComingSoon as false when env is "false"', () => {
      process.env.PRIVATE_STATS_COMING_SOON = 'false';

      const result = controller.getConfig();

      expect(result.privateStatsComingSoon).toBe(false);
    });
  });
});
