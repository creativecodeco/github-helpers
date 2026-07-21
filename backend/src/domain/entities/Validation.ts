export const GITHUB_USERNAME_REGEX = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;
export const GITHUB_REPO_REGEX = /^[a-z\d-_.]{1,100}$/i;

export function validateUsername(username: string): void {
  if (!username || typeof username !== 'string' || !GITHUB_USERNAME_REGEX.test(username)) {
    throw new Error('Usuario de GitHub inválido');
  }
}

export function validateRepo(repo: string): void {
  if (!repo || typeof repo !== 'string' || !GITHUB_REPO_REGEX.test(repo)) {
    throw new Error('Repositorio de GitHub inválido');
  }
}
