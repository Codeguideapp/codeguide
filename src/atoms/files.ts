import { atom } from 'jotai';
import * as monaco from 'monaco-editor';
import Delta from 'quill-delta';

import { getFiles } from '../api/api';
import { DiffMarkers, getDiffMarkers } from '../api/diffMarkers';
import {
  changesAtom,
  changesOrderAtom,
  highlightChangeIdAtom,
} from './changes';
import { saveDeltaAtom, saveFileNodeAtom } from './saveDeltaAtom';

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
export const unsavedFilePathsAtom = atom((get) => {
  const changes = get(changesAtom);
  return Object.values(changes)
    .filter((c) => c.isDraft)
    .map((c) => c.path);
});

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

export const setFileByPathAtom = atom(
  null,
  (get, set, path: string | undefined) => {
    const fileChanges = get(fileChangesAtom);

    const file = fileChanges.find((f) => f.path === path);

    set(activeFileAtom, file);

    if (!file) return;

    const changesOrder = get(changesOrderAtom);
    const changes = get(changesAtom);

    if (
      file.status !== 'added' &&
      !changesOrder.find((id) => changes[id].path === file.path)
    ) {
      // this is first time change is saved for a file
      set(saveDeltaAtom, {
        file,
        isFileDepChange: true,
        delta: new Delta().insert(file.oldVal),
      });
    }

    const highlightChangeId = get(highlightChangeIdAtom);

    if (!highlightChangeId) {
      set(saveFileNodeAtom, file.path);
    }
  }
);
