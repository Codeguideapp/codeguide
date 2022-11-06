import { ReactElement } from 'react-markdown/lib/react-markdown';

type TreeItem = {
  key: string;
  title: string;
  isLeaf: boolean;
  type: string;
  icon?: ReactElement | null;
  url: string;
  children?: TreeItem[];
};

const ROOT = Symbol('root');

export function pathsToTreeStructure(
  data: {
    type: 'tree' | 'blob';
    path: string;
    url: string;
    sha: string;
  }[]
): TreeItem[] {
  let references: Record<string | symbol, TreeItem> = {};

  references[ROOT] = {
    key: '',
    title: '',
    type: '',
    isLeaf: false,
    url: '',
    children: [],
  };

  for (const { path, type, url } of data) {
    const splittedPath = path.split('/');

    references[path] = {
      isLeaf: type !== 'tree',
      type,
      icon: null,
      key: path,
      url,
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
      references[parentPath].children!.push(references[path]);
      references[parentPath].children!.sort((a, b) =>
        a.isLeaf && !b.isLeaf ? 1 : !a.isLeaf && b.isLeaf ? -1 : 0
      );
    }
  }

  return references[ROOT].children!;
}
