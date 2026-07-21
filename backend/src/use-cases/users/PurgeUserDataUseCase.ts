import { AppDataSource } from '@/infrastructure/database/database';
import { UserTokenEntity } from '@/infrastructure/database/entities/UserTokenEntity';
import { UserMetric } from '@/infrastructure/database/entities/UserMetric';
import { UserStatsHistory } from '@/infrastructure/database/entities/UserStatsHistory';
import { RequestLog } from '@/infrastructure/database/entities/RequestLog';

export class PurgeUserDataUseCase {
  async execute(username: string): Promise<void> {
    await AppDataSource.transaction(async (transactionalEntityManager) => {
      // 1. Delete user token
      await transactionalEntityManager.delete(UserTokenEntity, { username });

      // 2. Delete user metrics (hits cache)
      await transactionalEntityManager.delete(UserMetric, { username });

      // 3. Delete user stats history snapshots
      await transactionalEntityManager.delete(UserStatsHistory, { username });

      // 4. Delete request logs associated to user
      await transactionalEntityManager.delete(RequestLog, { username });
    });
  }
}
