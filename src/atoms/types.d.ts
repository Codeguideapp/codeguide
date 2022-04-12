import type Delta from 'quill-delta';

export type Changes = Record<string, Readonly<Change>>; // changes is updated using immer so the result object can be read only
export type Change = {
  type: 'added' | 'modified' | 'deleted';
  isFileDepChange: boolean;
  delta: Delta;
  deltaInverted: Delta;
  id: string;
  x: number;
  color: string;
  path: string;
  deps: string[];
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
