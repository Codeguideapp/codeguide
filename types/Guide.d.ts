export type IGuide = {
  type: 'diff' | 'browse';
  id: string;
  createdBy: string;
  owner: string;
  repository: string;
  baseSha: string;
  prNum?: number;
  mergeCommitSha?: string;
  canEdit: string[];
};
