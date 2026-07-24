import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { ITokenRepository } from '@/domain/repositories/ITokenRepository';
import { getDecryptedToken } from '@/infrastructure/security/security';
import { renderTopReposCard } from '@/adapters/presenters/topReposCard';

export class GetUserTopReposCardUseCase {
  constructor(
    private readonly githubRepo: IGitHubRepository,
    private readonly tokenRepo?: ITokenRepository
  ) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>
  ): Promise<string> {
    const userToken = this.tokenRepo ? await getDecryptedToken(username, this.tokenRepo) : undefined;
    const repos = await this.githubRepo.getUserTopRepos(username, 4, userToken);
    return renderTopReposCard(repos, theme, overrides);
  }
}
