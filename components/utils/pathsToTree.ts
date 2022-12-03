import { ReactElement } from 'react-markdown/lib/react-markdown';

import { RepoFileRef } from '../store/files';

type TreeItem = {
  key: string;
  title: string;
  isLeaf: boolean;
  type: string;
  icon?: ReactElement | null;
  url: string;
  children?: TreeItem[];
  file?: RepoFileRef;
};

const ROOT = Symbol('root');

export function pathsToTreeStructure(data: RepoFileRef[]): TreeItem[] {
  let references: Record<string | symbol, TreeItem> = {};

  references[ROOT] = {
    key: '',
    title: '',
    type: '',
    isLeaf: false,
    url: '',
    children: [],
  };

  for (const file of data) {
    const splittedPath = file.path.split('/');

    references[file.path] = {
      isLeaf: file.type !== 'tree',
      type: file.type,
      icon: null,
      key: file.path,
      url: file.url,
      title: splittedPath[splittedPath.length - 1],
      file,
    };

    // add item to parent cildren
    splittedPath.pop();
    const parentPath =
      splittedPath.length === 0 ? ROOT : splittedPath.join('/');
    if (references[parentPath]) {
      if (!references[parentPath].children) {
        references[parentPath].children = [];
      }
      references[parentPath].children!.push(references[file.path]);
      references[parentPath].children!.sort((a, b) =>
        a.isLeaf && !b.isLeaf ? 1 : !a.isLeaf && b.isLeaf ? -1 : 0
      );
    }
  }

  return references[ROOT].children!;
}
