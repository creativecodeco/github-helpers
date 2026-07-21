import { IGitHubRepository } from '@/domain/repositories/IGitHubRepository';
import { renderTopReposCard } from '@/adapters/presenters/topReposCard';

export class GetUserTopReposCardUseCase {
  constructor(private readonly githubRepo: IGitHubRepository) {}

  async execute(
    username: string,
    theme: string,
    overrides: Record<string, string>
  ): Promise<string> {
    const repos = await this.githubRepo.getUserTopRepos(username);
    return renderTopReposCard(repos, theme, overrides);
  }
}
