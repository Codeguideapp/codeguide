import { ReactElement } from 'react-markdown/lib/react-markdown';

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
      icon: null,
      key: file.path,
      title: splittedPath[splittedPath.length - 1],
    };

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
