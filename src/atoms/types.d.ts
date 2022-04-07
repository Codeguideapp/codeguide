import type Delta from 'quill-delta';

export type Change = AddFileChange | ModifiedFileChange | DeleteFileChange;
export type Changes = Record<string, Readonly<Change>>;
interface ChangeBase {
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
}

interface AddFileChange extends ChangeBase {
  type: 'added';
  originalVal: string;
  delta: Delta; // todo remove
  deltaInverted: Delta;
}

interface ModifiedFileChange extends ChangeBase {
  type: 'modified';
  delta: Delta;
  deltaInverted: Delta;
}

interface DeleteFileChange extends ChangeBase {
  type: 'deleted';
  delta: Delta; // todo remove
  deltaInverted: Delta;
}
