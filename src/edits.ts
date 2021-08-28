import * as Y from "yjs";

export function sync(ytext1: Y.Text, ytext2: Y.Text) {
  const ydoc1 = ytext1.doc;
  const ydoc2 = ytext2.doc;

  if (!ydoc1 || !ydoc2) {
    throw new Error("missing y.doc instance");
  }
  const state1 = Y.encodeStateAsUpdate(ydoc1);
  const state2 = Y.encodeStateAsUpdate(ydoc2);

  Y.applyUpdate(ydoc1, state2);
  Y.applyUpdate(ydoc2, state1);
}

export const createYText = (initial: Y.Text | string) => {
  const doc = new Y.Doc();
  const ytext = doc.getText("file");

  if (typeof initial === "string") {
    ytext.insert(0, initial);
  } else {
    sync(ytext, initial);
  }

  return ytext;
};