import { parseGithubUrl } from './parseGithubUrl';

describe('parseGithubUrl', () => {
  test('should extract the correct information from a valid URL', () => {
    expect(
      parseGithubUrl('https://github.com/codeguideapp/codeguide/')
    ).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: null,
    });

    expect(parseGithubUrl('github.com/codeguideapp/codeguide/')).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: null,
    });

    expect(parseGithubUrl('github.com/vercel/next.js')).toEqual({
      owner: 'vercel',
      repository: 'next.js',
      pullRequest: null,
    });

    expect(parseGithubUrl('#/codeguideapp/codeguide/')).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: null,
    });

    expect(
      parseGithubUrl('https://github.com/codeguideapp/codeguide/pull/4')
    ).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: 4,
    });

    expect(parseGithubUrl('github.com/codeguideapp/codeguide/pull/4')).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: 4,
    });

    expect(parseGithubUrl('github.com/codeguideapp/codeguide/pull/4')).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: 4,
    });

    expect(parseGithubUrl('#codeguideapp/codeguide/pull/4')).toEqual({
      owner: 'codeguideapp',
      repository: 'codeguide',
      pullRequest: 4,
    });
  });
  test('should throw an error for invalid URLs', () => {
    expect(() => parseGithubUrl('not-a-valid-url')).toThrowError(Error);
    expect(() => parseGithubUrl('github.com')).toThrowError(Error);
    expect(() => parseGithubUrl('github.com/user')).toThrowError(Error);
  });
});
