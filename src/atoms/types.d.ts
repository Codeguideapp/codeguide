import type * as monaco from 'monaco-editor';
import type Delta from 'quill-delta';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only

export type Change = {
  fileStatus: 'added' | 'modified' | 'deleted';
  highlight: {
    offset: number;
    length: number;
    type: 'delete' | 'insert' | 'replace';
    options: monaco.editor.IModelDecorationOptions;
  }[];
  parentChangeId?: string;
  children: string[];
  isFileDepChange: boolean;
  delta?: Delta;
  deltaInverted?: Delta;
  stat: [number, number];
  id: string;
  x: number;
  path: string;
  width: number;
  actions: Record<
    string,
    {
      label: string;
      color: string;
      callback: () => void;
    }
  >;
};
