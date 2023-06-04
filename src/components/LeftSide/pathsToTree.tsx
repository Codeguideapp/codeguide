import { ReactElement } from 'react-markdown/lib/react-markdown';

import { FileIcon } from './FileIcon';

type TreeItem = {
  key: string;
  title: string;
  isLeaf: boolean;
  type: string;
  icon?: ReactElement | null;
  children?: TreeItem[];
};

const ROOT = Symbol('root');

export function pathsToTreeStructure(
  data: {
    path: string;
    type: string;
  }[]
): TreeItem[] {
  const references: Record<string | symbol, TreeItem> = {};

  references[ROOT] = {
    key: '',
    title: '',
    type: '',
    isLeaf: false,
    children: [],
  };

  for (const file of data) {
    const splittedPath = file.path.split('/');

    references[file.path] = {
      isLeaf: file.type !== 'tree',
      type: file.type,
      icon: file.type === 'tree' ? null : <FileIcon path={file.path} />,
      key: file.path,
      title: splittedPath[splittedPath.length - 1],
    };

    // ensure parent exists
    let currentPath = '';
    let lastPath: string | symbol = ROOT;
    for (const pathPart of splittedPath) {
      currentPath += pathPart;
      if (!references[currentPath]) {
        references[currentPath] = {
          isLeaf: false,
          type: 'tree',
          icon: null,
          key: currentPath,
          title: pathPart,
          children: [],
        };

        if (!references[lastPath].children) {
          references[lastPath].children = [];
        }
        references[lastPath].children?.push(references[currentPath]);
        references[lastPath].children?.sort((a, b) =>
          a.isLeaf && !b.isLeaf ? 1 : !a.isLeaf && b.isLeaf ? -1 : 0
        );
      }
      lastPath = currentPath;
      currentPath += '/';
    }

    // add item to parent cildren
    splittedPath.pop();
    const parentPath =
      splittedPath.length === 0 ? ROOT : splittedPath.join('/');

    if (references[parentPath]) {
      if (!references[parentPath].children) {
        references[parentPath].children = [];
      }
      references[parentPath].children?.push(references[file.path]);
      references[parentPath].children?.sort((a, b) =>
        a.isLeaf && !b.isLeaf ? 1 : !a.isLeaf && b.isLeaf ? -1 : 0
      );
    }
  }

  return references[ROOT].children || [];
}
