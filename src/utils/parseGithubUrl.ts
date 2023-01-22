const githubUrlRegex =
  /(https?:\/\/)?(www\.)?(github\.com)[\/]?([A-Za-z0-9-_.]+\/[A-Za-z0-9-_.]+(\/(pull\/\d+)?)?)/;

export function parseGithubUrl(url: string): {
  owner: string;
  repository: string;
  pullRequest: number | null;
} {
  const match = githubUrlRegex.exec(url);
  if (match) {
    const path = match[4];
    const [owner, repository, , pullRequest = null] = path.split('/');

    return {
      owner,
      repository,
      pullRequest: pullRequest ? parseInt(pullRequest, 10) : null,
    };
  }
  throw new Error('Invalid URL');
}
