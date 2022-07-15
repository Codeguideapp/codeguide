import { atom } from 'jotai';
import * as monaco from 'monaco-editor';

import { getFiles } from '../api/api';
import { DiffMarkers, getDiffMarkers } from '../api/diffMarkers';

export type File = {
  status: 'added' | 'modified' | 'deleted';
  path: string;
  oldVal: string;
  newVal: string;
  prevVal: string;
  totalDiffMarkers: number;
  diffMarkers: DiffMarkers;
};

export const activeFileAtom = atom<File | undefined>(undefined);
export const fileChangesAtom = atom<File[]>([]);

export const setFileChangesAtom = atom(null, async (get, set, pr: number) => {
  const apiFiles = await getFiles(pr);

  const monacoModel = monaco.editor.createModel('', '');

  const files: File[] = apiFiles.map((f) => {
    monacoModel.setValue(f.oldVal);

    const diffMarkers = getDiffMarkers({
      modifiedValue: f.oldVal,
      originalValue: f.newVal,
      eol: monacoModel.getEOL(),
    });

    return {
      ...f,
      prevVal: f.oldVal,
      diffMarkers,
      totalDiffMarkers: Object.keys(diffMarkers).length,
    };
  });

  monacoModel.dispose();

  set(fileChangesAtom, files);
});
