import { FileDiff } from '../atoms/getFilesDiff';

export const mockFiles: FileDiff[] = [
  {
    path: 'src/atoms/saveDeltaAtom.ts',
    status: 'modified',
    oldVal: `import produce from 'immer';
import { atom } from 'jotai';
import { uniq } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { composeDeltas, deltaToString } from '../utils/deltaUtils';
import { changesAtom, changesOrderAtom } from './changes';
import { activeFileAtom } from './files';
import { setPlayheadXAtom } from './playhead';

// todo: find ways to refactor

export const saveDeltaAtom = atom(null, (get, set, delta: Delta) => {
  const newDraftId = nanoid();

  const file = get(activeFileAtom);
  let changes = get(changesAtom);
  let changesOrder = get(changesOrderAtom);

  if (!file) throw new Error('no file is active');

  const isFileFirstChange =
    Object.values(changes).find(({ path }) => path === file.path) === undefined;

  if (
    (file.status === 'modified' || file.status === 'deleted') &&
    isFileFirstChange
  ) {
    // in case this is the first change for a file
    // we need to add an initial "isFileDepChange" change
    const id = nanoid();

    const newChangesOrder = [id, ...changesOrder];
    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[id] = {
        isFileDepChange: true,
        status: 'modified',
        id,
        actions: {},
        color: '#0074bb',
        delta: new Delta().insert(file.oldVal),
        deltaInverted: new Delta(),
        deps: [],
        path: file.path,
        width: 0,
        x: 0,
      };
    });

    set(changesAtom, newChanges);
    set(changesOrderAtom, newChangesOrder);
    changes = get(changesAtom);
    changesOrder = get(changesOrderAtom);
  }

  let changeType = file.status;
  if (file.status === 'added') {
    if (isFileFirstChange) {
      changeType = 'added';
    } else {
      changeType = 'modified';
    }
  } else if (file.status === 'deleted') {
    const deltas = Object.values(changes)
      .filter(({ path }) => path === file.path)
      .map((c) => c.delta);

    if (deltaToString([...deltas, delta]) === '') {
      changeType = 'deleted';
    } else {
      changeType = 'modified';
    }
  }

  const appliedIds = changesOrder.filter(
    (id) => changes[id].path === file.path
  );

  const takenCoordinates = calcCoordinates(
    appliedIds.map((id) => ({
      id,
      delta: changes[id].delta,
    }))
  );

  const foundDeps = takenCoordinates
    .filter((taken) => {
      // first transforming draft to the point when "taken" was applied
      const toUndo = appliedIds.slice(appliedIds.indexOf(taken.id) + 1);

      const toUndoDelta = composeDeltas(
        toUndo.map((id) => changes[id].deltaInverted)
      );
      const draftTransformed = toUndoDelta.transform(delta);
      const draftCoordinates = calcCoordinates([
        {
          id: newDraftId,
          delta: draftTransformed,
        },
      ]);

      return draftCoordinates.find((draft) => {
        // check if it's overlapping
        if (!taken || !draft) {
          return false;
        }
        if (taken.op === 'insert' && draft.op === 'insert') {
          return taken.to >= draft.from && taken.from <= draft.from;
        }
        return taken.to >= draft.from && taken.from <= draft.to;
      });
    })
    .map(({ id }) => {
      return [...changes[id].deps, id];
    })
    .flat();

  const deps = uniq(foundDeps).sort(
    (a, b) => changesOrder.indexOf(a) - changesOrder.indexOf(b)
  );

  const baseIds = appliedIds.filter((id) => deps.includes(id));
  const idsToUndo = appliedIds.filter((id) => !deps.includes(id));

  const baseComposed = composeDeltas(baseIds.map((id) => changes[id].delta));
  const toUndoComposed = composeDeltas(
    idsToUndo.map((id) => changes[id].delta)
  );
  const undoChanges = toUndoComposed.invert(baseComposed);
  const draftChangeTransformed = undoChanges.transform(delta);

  const newChangesOrder = [...changesOrder, newDraftId];

  const newChanges = produce(changes, (changesDraft) => {
    changesDraft[newDraftId] = {
      isFileDepChange: false,
      status: changeType,
      id: newDraftId,
      color: changeType === 'modified' ? '#374957' : '#0074bb',
      width: 50,
      x: 0,
      actions: {
        discardDraft: {
          label: 'Discard Draft',
          color: 'red',
          callback: () => {},
        },
        saveChanges: {
          label: 'Save Changes',
          color: 'green',
          callback: () => {},
        },
      },
      deps,
      path: file.path,
      delta: draftChangeTransformed,
      deltaInverted: draftChangeTransformed.invert(baseComposed),
    };

    let x = 10;
    for (const id of newChangesOrder) {
      if (changesDraft[id].isFileDepChange) {
        continue;
      }
      changesDraft[id].x = x;
      x += changesDraft[id].width + 10;
    }
  });

  set(changesAtom, newChanges);
  set(changesOrderAtom, newChangesOrder);
  set(setPlayheadXAtom, Infinity);
});

type Coordinate = {
  from: number;
  to: number;
  id: string;
  op: 'insert' | 'delete';
};

export function calcCoordinates(
  data: { delta: Delta; id: string }[]
): Coordinate[] {
  return data
    .map(({ delta, id }) => {
      let index = 0;
      return delta
        .map((op) => {
          if (op.retain) {
            index += op.retain;
            return null;
          } else if (op.delete) {
            return {
              id,
              from: index,
              to: index + op.delete,
              op: 'delete',
            };
          } else if (typeof op.insert === 'string') {
            return {
              id,
              from: index,
              to: index + op.insert.length,
              op: 'insert',
            };
          }
          return null;
        })
        .filter((op) => op !== null);
    })
    .flat() as Coordinate[];
}

`,
    newVal: `import produce from 'immer';
import { atom } from 'jotai';
import { uniq } from 'lodash';
import { nanoid } from 'nanoid';
import Delta from 'quill-delta';

import { deltaToString } from '../utils/deltaUtils';
import { getDeltas } from '../utils/getFileContent';
import { changesAtom, changesOrderAtom } from './changes';
import { activeFileAtom } from './files';
import { setPlayheadXAtom } from './playhead';

// todo: find ways to refactor

// parent?: string
// add new group change with children: []
// create new delta for that change

export const saveDeltaAtom = atom(
  null,
  (get, set, { delta, groupId }: { delta: Delta; groupId?: string }) => {
    const newDraftId = nanoid();

    const file = get(activeFileAtom);
    let changes = get(changesAtom);
    let changesOrder = get(changesOrderAtom);

    if (!file) throw new Error('no file is active');

    const isFileFirstChange =
      Object.values(changes).find(({ path }) => path === file.path) ===
      undefined;

    if (
      (file.status === 'modified' || file.status === 'deleted') &&
      isFileFirstChange
    ) {
      // in case this is the first change for a file
      // we need to add an initial "isFileDepChange" change
      const id = nanoid();

      const newChangesOrder = [id, ...changesOrder];
      const newChanges = produce(changes, (changesDraft) => {
        changesDraft[id] = {
          isFileDepChange: true,
          parent: groupId,
          chldren: [],
          status: 'modified',
          id,
          actions: {},
          color: '#0074bb',
          delta: new Delta().insert(file.oldVal),
          deps: [],
          path: file.path,
          width: 0,
          x: 0,
        };
      });

      set(changesAtom, newChanges);
      set(changesOrderAtom, newChangesOrder);
      changes = get(changesAtom);
      changesOrder = get(changesOrderAtom);
    }

    let changeType = file.status;
    if (file.status === 'added') {
      if (isFileFirstChange) {
        changeType = 'added';
      } else {
        changeType = 'modified';
      }
    } else if (file.status === 'deleted') {
      const deltas = Object.values(changes)
        .filter(({ path }) => path === file.path)
        .map((c) => c.delta);

      if (deltaToString([...deltas, delta]) === '') {
        changeType = 'deleted';
      } else {
        changeType = 'modified';
      }
    }

    const appliedIds = changesOrder.filter(
      (id) => changes[id].path === file.path
    );

    const deltasToNow = getDeltas({
      changeId: appliedIds[appliedIds.length - 1],
      changes,
      changesOrder: appliedIds,
    });

    const takenCoordinates = calcCoordinates(deltasToNow);

    // const foundDeps1 = takenCoordinates
    //   .filter((taken) => {
    //     // first transform draft as if it is applied after taken.id
    //     const deltasToTaken = getDeltas({
    //       changeId: taken.id,
    //       changes,
    //       changesOrder,
    //     });

    //     // deltas after taken id:

    //   })
    //   .map(({ id }) => {
    //     return [...changes[id].deps, id];
    //   })
    //   .flat();

    const draftCoordinates = calcCoordinates([
      {
        id: newDraftId,
        delta,
      },
    ]);
    const draftStartOffset = draftCoordinates[0].from;

    const foundDeps = takenCoordinates
      .filter((taken) => {
        // first transforming draft to the point when "taken" was applied
        const deltasToTaken = deltasToNow.slice(
          deltasToNow.findIndex((d) => d.id === taken.id) + 1
        );

        const aa = calcCoordinates(deltasToTaken.reverse());
        let offset = 0;
        for (const toUndoCoordinate of aa) {
          if (toUndoCoordinate.from < draftStartOffset) {
            // happend before new change (changes offset)
            const to =
              draftStartOffset < toUndoCoordinate.to
                ? draftStartOffset
                : toUndoCoordinate.to;

            if (toUndoCoordinate.op === 'insert') {
              offset += to - toUndoCoordinate.from;
            } else if (toUndoCoordinate.op === 'delete') {
              offset -= to - toUndoCoordinate.from;
            }
          }
        }

        const transformBase =
          offset >= 0
            ? new Delta().delete(offset)
            : new Delta().insert(' '.repeat(offset));

        // let composedDelta = new Delta();
        // for (let i = toUndo.length - 1; i >= 0; i--) {
        //   composedDelta = composedDelta.compose(toUndo[i].delta);
        // }
        // const inverted = composedDelta.invert(new Delta());

        const draftTransformed = transformBase.transform(delta);
        const draftCoordinates = calcCoordinates([
          {
            id: newDraftId,
            delta: draftTransformed,
          },
        ]);

        return draftCoordinates.find((draft) => {
          // check if it's overlapping
          if (!taken || !draft) {
            return false;
          }
          if (taken.op === 'insert' && draft.op === 'insert') {
            return taken.to >= draft.from && taken.from <= draft.from;
          }
          return taken.to >= draft.from && taken.from <= draft.to;
        });
      })
      .map(({ id }) => {
        return [...changes[id].deps, id];
      })
      .flat();

    const deps = uniq(foundDeps).sort(
      (a, b) => changesOrder.indexOf(a) - changesOrder.indexOf(b)
    );
    // transform delta to the point when last dep was inserted
    const dep = deps[deps.length - 1];
    const deltasToLastDep = deltasToNow.slice(
      deltasToNow.findIndex((d) => d.id === dep) + 1
    );

    // sad se gleda samo zadnji dep, vj treba sve

    // const baseIds = appliedIds.filter((id) => deps.includes(id));
    // const idsToUndo = appliedIds.filter((id) => !deps.includes(id));

    const toUndoCoordinates = calcCoordinates(deltasToLastDep);

    let transformBase = new Delta();
    for (const toUndoCoordinate of toUndoCoordinates) {
      if (
        !deps.includes(toUndoCoordinate.id) &&
        toUndoCoordinate.to < draftStartOffset
      ) {
        // happend before new change (changes offset)
        transformBase = transformBase.compose(toUndoCoordinate.delta);
      }
    }

    transformBase = transformBase.invert(new Delta());
    const draftTransformed = transformBase.transform(delta);

    console.log(
      deps.map((d) => changes[d].delta),
      draftTransformed
    );
    // todo: refactor ugly tenery:
    const newChangesOrder = groupId
      ? changes[groupId]
        ? changesOrder
        : [...changesOrder, groupId]
      : [...changesOrder, newDraftId];

    const newChanges = produce(changes, (changesDraft) => {
      changesDraft[newDraftId] = {
        parent: groupId,
        isFileDepChange: false,
        chldren: [],
        status: changeType,
        id: newDraftId,
        color: changeType === 'modified' ? '#374957' : '#0074bb',
        width: 50,
        x: 0,
        actions: {
          discardDraft: {
            label: 'Discard Draft',
            color: 'red',
            callback: () => {},
          },
          saveChanges: {
            label: 'Save Changes',
            color: 'green',
            callback: () => {},
          },
        },
        deps,
        path: file.path,
        delta: draftTransformed,
      };

      const newChangesOrder = [...changesOrder, newDraftId];

      let x = 10;
      for (const id of newChangesOrder) {
        if (changesDraft[id].isFileDepChange) {
          continue;
        }
        changesDraft[id].x = x;
        x += changesDraft[id].width + 10;
      }
    });

    if (groupId) {
      set(
        changesAtom,
        produce(newChanges, (changesDraft) => {
          if (changesDraft[groupId]) {
            changesDraft[groupId].chldren.push(newDraftId);
            changesDraft[groupId].deps = uniq([
              ...changesDraft[groupId].deps,
              ...changesDraft[newDraftId].deps,
            ]);
          } else {
            changesDraft[groupId] = {
              isFileDepChange: false,
              chldren: [newDraftId],
              status: changeType,
              id: groupId,
              color: changeType === 'modified' ? '#374957' : '#0074bb',
              width: 50,
              x: 0,
              actions: {
                discardDraft: {
                  label: 'Discard Draft',
                  color: 'red',
                  callback: () => {},
                },
                saveChanges: {
                  label: 'Save Changes',
                  color: 'green',
                  callback: () => {},
                },
              },
              deps,
              path: file.path,
              delta: new Delta(),
            };
          }
        })
      );
    } else {
      set(changesAtom, newChanges);
    }
    set(changesOrderAtom, newChangesOrder);
    set(setPlayheadXAtom, Infinity);
  }
);

type Coordinate = {
  from: number;
  to: number;
  id: string;
  delta: Delta;
  op: 'insert' | 'delete';
};

export function calcCoordinates(
  data: { delta: Delta; id: string }[]
): Coordinate[] {
  return data
    .map(({ delta, id }) => {
      let index = 0;
      return delta
        .map((op) => {
          if (op.retain) {
            index += op.retain;
            return null;
          } else if (op.delete) {
            const toReturn = {
              id,
              from: index,
              to: index + op.delete,
              delta: new Delta().retain(index).delete(op.delete),
              op: 'delete',
            };
            index -= op.delete;
            return toReturn;
          } else if (typeof op.insert === 'string') {
            const toReturn = {
              id,
              from: index,
              to: index + op.insert.length,
              delta: new Delta().retain(index).insert(op.insert),
              op: 'insert',
            };
            index += op.insert.length;
            return toReturn;
          }
          return null;
        })
        .filter((op) => op !== null);
    })
    .flat() as Coordinate[];
}

export function getOffset(delta: Delta): number {
  let offset = 0;
  delta.forEach((op) => {
    if (op.retain) {
      offset += op.retain;
      return null;
    } else if (op.delete) {
      offset = offset - op.delete;
    } else if (typeof op.insert === 'string') {
      offset = offset + op.insert.length;
    }
  });

  return offset;
}

`,
  },
  {
    path: 'side-effect-big-filename-test-test.ts',
    status: 'modified',
    oldVal: `import React, { Component } from 'react'

const isServer = typeof window === 'undefined'

type State = JSX.Element[] | undefined

type SideEffectProps = {
  reduceComponentsToState: <T>(
    components: Array<React.ReactElement<any>>,
    props: T
  ) => State
  handleStateChange?: (state: State) => void
  headManager: any
  inAmpMode?: boolean
}

export default class extends Component<SideEffectProps> {
  private _hasHeadManager: boolean

  emitChange = (): void => {
    if (this._hasHeadManager) {
      this.props.headManager.updateHead(
        this.props.reduceComponentsToState(
          [...this.props.headManager.mountedInstances],
          this.props
        )
      )
    }
  }

  constructor(props: any) {
    super(props)
    this._hasHeadManager =
      this.props.headManager && this.props.headManager.mountedInstances

    if (isServer && this._hasHeadManager) {
      this.props.headManager.mountedInstances.add(this)
      this.emitChange()
    }
  }
  componentDidMount() {
    if (this._hasHeadManager) {
      this.props.headManager.mountedInstances.add(this)
    }
    this.emitChange()
  }
  componentDidUpdate() {
    this.emitChange()
  }
  componentWillUnmount() {
    if (this._hasHeadManager) {
      this.props.headManager.mountedInstances.delete(this)
    }
    this.emitChange()
  }

  render() {
    return null
  }
}
`,
    newVal: `import React, { Children, useEffect, useLayoutEffect } from 'react'

type State = JSX.Element[] | undefined

type SideEffectProps = {
  reduceComponentsToState: <T>(
    components: Array<React.ReactElement<any>>,
    props: T
  ) => State
  handleStateChange?: (state: State) => void
  headManager: any
  inAmpMode?: boolean
  children: React.ReactNode
}

const isServer = typeof window === 'undefined'
const useClientOnlyLayoutEffect = isServer ? () => {} : useLayoutEffect
const useClientOnlyEffect = isServer ? () => {} : useEffect

export default function SideEffect(props: SideEffectProps) {
  const { headManager, reduceComponentsToState } = props

  function emitChange() {
    if (headManager && headManager.mountedInstances) {
      const headElements = Children.toArray(
        headManager.mountedInstances
      ).filter(Boolean) as React.ReactElement[]
      headManager.updateHead(reduceComponentsToState(headElements, props))
    }
  }

  if (isServer) {
    headManager?.mountedInstances?.add(props.children)
    emitChange()
  }

  useClientOnlyLayoutEffect(() => {
    headManager?.mountedInstances?.add(props.children)
    return () => {
      headManager?.mountedInstances?.delete(props.children)
    }
  })

  // We need to call \`updateHead\` method whenever the \`SideEffect\` is trigger in all
  // life-cycles: mount, update, unmount. However, if there are multiple \`SideEffect\`s
  // being rendered, we only trigger the method from the last one.
  // This is ensured by keeping the last unflushed \`updateHead\` in the \`_pendingUpdate\`
  // singleton in the layout effect pass, and actually trigger it in the effect pass.
  useClientOnlyLayoutEffect(() => {
    if (headManager) {
      headManager._pendingUpdate = emitChange
    }
    return () => {
      if (headManager) {
        headManager._pendingUpdate = emitChange
      }
    }
  })

  useClientOnlyEffect(() => {
    if (headManager && headManager._pendingUpdate) {
      headManager._pendingUpdate()
      headManager._pendingUpdate = null
    }
    return () => {
      if (headManager && headManager._pendingUpdate) {
        headManager._pendingUpdate()
        headManager._pendingUpdate = null
      }
    }
  })

  return null
}
`,
  },
  {
    path: 'import.ts',
    status: 'modified',
    oldVal: `export const httpOperation = {
  id: '?http-operation-id?',
  iid: 'POST_todos',
  description: 'This creates a Todo object.Testing inline code.',
  method: 'post',
  path: '/todos',
  summary: 'Create Todo'
}`,
    newVal: `import { IHttpOperation } from '@stoplight/types';
import type { JSONSchema7 } from 'json-schema';

export const httpOperation: IHttpOperation & { __bundled__: unknown } = {
  id: '?http-operation-id?',
  iid: 'POST_todos',
  description: 'This creates a Todo object.Testing inline code.',
  method: 'post',
  path: '/todos',
  summary: 'Create Todo'
}`,
  },
  {
    path: 'lockfile.lock',
    status: 'modified',
    oldVal: `
moment@^2.29.1:
  version "2.29.1"
  resolved "https://registry.yarnpkg.com/moment/-/moment-2.29.1.tgz#b2be769fa31940be9eeea6469c075e35006fa3d3"
  integrity sha512-kHmoybcPV8Sqy59DwNDY3Jefr64lK/by/da0ViFcuA4DH0vQg5Q6Ze5VimxkfQNSC+Mls/Kx53s7TjP1RhFEDQ==`,
    newVal: `
moment@^2.29.1:
  version "2.29.4"
  resolved "https://registry.yarnpkg.com/moment/-/moment-2.29.4.tgz#3dbe052889fe7c1b2ed966fcb3a77328964ef108"
  integrity sha512-5LC9SOxjSc2HF6vO2CyuTDNivEdoz2IvyJJGj6X8DJ0eFyfszE0QiEd+iXmBvUP3WHxSjFH/vIsA0EN00cgr8w==`,
  },
  {
    path: 'vercel/head-manager.ts',
    status: 'modified',
    oldVal: `export const DOMAttributeNames: Record<string, string> = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
  noModule: 'noModule',
}

function reactElementToDOM({ type, props }: JSX.Element): HTMLElement {
  const el: HTMLElement = document.createElement(type)
  for (const p in props) {
    if (!props.hasOwnProperty(p)) continue
    if (p === 'children' || p === 'dangerouslySetInnerHTML') continue

    // we don't render undefined props to the DOM
    if (props[p] === undefined) continue

    const attr = DOMAttributeNames[p] || p.toLowerCase()
    if (
      type === 'script' &&
      (attr === 'async' || attr === 'defer' || attr === 'noModule')
    ) {
      ;(el as HTMLScriptElement)[attr] = !!props[p]
    } else {
      el.setAttribute(attr, props[p])
    }
  }

  const { children, dangerouslySetInnerHTML } = props
  if (dangerouslySetInnerHTML) {
    el.innerHTML = dangerouslySetInnerHTML.__html || ''
  } else if (children) {
    el.textContent =
      typeof children === 'string'
        ? children
        : Array.isArray(children)
        ? children.join('')
        : ''
  }
  return el
}

/**
 * When a \`nonce\` is present on an element, browsers such as Chrome and Firefox strip it out of the
 * actual HTML attributes for security reasons *when the element is added to the document*. Thus,
 * given two equivalent elements that have nonces, \`Element,isEqualNode()\` will return false if one
 * of those elements gets added to the document. Although the \`element.nonce\` property will be the
 * same for both elements, the one that was added to the document will return an empty string for
 * its nonce HTML attribute value.
 *
 * This custom \`isEqualNode()\` function therefore removes the nonce value from the \`newTag\` before
 * comparing it to \`oldTag\`, restoring it afterwards.
 *
 * For more information, see:
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1211471#c12
 */
export function isEqualNode(oldTag: Element, newTag: Element) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute('nonce')
    // Only strip the nonce if \`oldTag\` has had it stripped. An element's nonce attribute will not
    // be stripped if there is no content security policy response header that includes a nonce.
    if (nonce && !oldTag.getAttribute('nonce')) {
      const cloneTag = newTag.cloneNode(true) as typeof newTag
      cloneTag.setAttribute('nonce', '')
      cloneTag.nonce = nonce
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag)
    }
  }

  return oldTag.isEqualNode(newTag)
}

function updateElements(type: string, components: JSX.Element[]): void {
  const headEl = document.getElementsByTagName('head')[0]
  const headCountEl: HTMLMetaElement = headEl.querySelector(
    'meta[name=next-head-count]'
  ) as HTMLMetaElement
  if (process.env.NODE_ENV !== 'production') {
    if (!headCountEl) {
      console.error(
        'Warning: next-head-count is missing. https://nextjs.org/docs/messages/next-head-count-missing'
      )
      return
    }
  }

  const headCount = Number(headCountEl.content)
  const oldTags: Element[] = []

  for (
    let i = 0, j = headCountEl.previousElementSibling;
    i < headCount;
    i++, j = j?.previousElementSibling || null
  ) {
    if (j?.tagName?.toLowerCase() === type) {
      oldTags.push(j)
    }
  }
  const newTags = (components.map(reactElementToDOM) as HTMLElement[]).filter(
    (newTag) => {
      for (let k = 0, len = oldTags.length; k < len; k++) {
        const oldTag = oldTags[k]
        if (isEqualNode(oldTag, newTag)) {
          oldTags.splice(k, 1)
          return false
        }
      }
      return true
    }
  )

  oldTags.forEach((t) => t.parentNode?.removeChild(t))
  newTags.forEach((t) => headEl.insertBefore(t, headCountEl))
  headCountEl.content = (headCount - oldTags.length + newTags.length).toString()
}

export default function initHeadManager(): {
  mountedInstances: Set<unknown>
  updateHead: (head: JSX.Element[]) => void
} {
  let updatePromise: Promise<void> | null = null

  return {
    mountedInstances: new Set(),
    updateHead: (head: JSX.Element[]) => {
      const promise = (updatePromise = Promise.resolve().then(() => {
        if (promise !== updatePromise) return

        updatePromise = null
        const tags: Record<string, JSX.Element[]> = {}

        head.forEach((h) => {
          if (
            // If the font tag is loaded only on client navigation
            // it won't be inlined. In this case revert to the original behavior
            h.type === 'link' &&
            h.props['data-optimized-fonts']
          ) {
            if (
              document.querySelector(
                \`style[data-href="\${h.props['data-href']}"]\`
              )
            ) {
              return
            } else {
              h.props.href = h.props['data-href']
              h.props['data-href'] = undefined
            }
          }

          const components = tags[h.type] || []
          components.push(h)
          tags[h.type] = components
        })

        const titleComponent = tags.title ? tags.title[0] : null
        let title = ''
        if (titleComponent) {
          const { children } = titleComponent.props
          title =
            typeof children === 'string'
              ? children
              : Array.isArray(children)
              ? children.join('')
              : ''
        }
        if (title !== document.title) document.title = title
        ;['meta', 'base', 'link', 'style', 'script'].forEach((type) => {
          updateElements(type, tags[type] || [])
        })
      }))
    },
  }
}
`,
    newVal: `export const DOMAttributeNames: Record<string, string> = {
  acceptCharset: 'accept-charset',
  className: 'class',
  htmlFor: 'for',
  httpEquiv: 'http-equiv',
  noModule: 'noModule',
}

function reactElementToDOM({ type, props }: JSX.Element): HTMLElement {
  const el: HTMLElement = document.createElement(type)
  for (const p in props) {
    if (!props.hasOwnProperty(p)) continue
    if (p === 'children' || p === 'dangerouslySetInnerHTML') continue

    // we don't render undefined props to the DOM
    if (props[p] === undefined) continue

    const attr = DOMAttributeNames[p] || p.toLowerCase()
    if (
      type === 'script' &&
      (attr === 'async' || attr === 'defer' || attr === 'noModule')
    ) {
      ;(el as HTMLScriptElement)[attr] = !!props[p]
    } else {
      el.setAttribute(attr, props[p])
    }
  }

  const { children, dangerouslySetInnerHTML } = props
  if (dangerouslySetInnerHTML) {
    el.innerHTML = dangerouslySetInnerHTML.__html || ''
  } else if (children) {
    el.textContent =
      typeof children === 'string'
        ? children
        : Array.isArray(children)
        ? children.join('')
        : ''
  }
  return el
}

/**
 * When a \`nonce\` is present on an element, browsers such as Chrome and Firefox strip it out of the
 * actual HTML attributes for security reasons *when the element is added to the document*. Thus,
 * given two equivalent elements that have nonces, \`Element,isEqualNode()\` will return false if one
 * of those elements gets added to the document. Although the \`element.nonce\` property will be the
 * same for both elements, the one that was added to the document will return an empty string for
 * its nonce HTML attribute value.
 *
 * This custom \`isEqualNode()\` function therefore removes the nonce value from the \`newTag\` before
 * comparing it to \`oldTag\`, restoring it afterwards.
 *
 * For more information, see:
 * https://bugs.chromium.org/p/chromium/issues/detail?id=1211471#c12
 */
export function isEqualNode(oldTag: Element, newTag: Element) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute('nonce')
    // Only strip the nonce if \`oldTag\` has had it stripped. An element's nonce attribute will not
    // be stripped if there is no content security policy response header that includes a nonce.
    if (nonce && !oldTag.getAttribute('nonce')) {
      const cloneTag = newTag.cloneNode(true) as typeof newTag
      cloneTag.setAttribute('nonce', '')
      cloneTag.nonce = nonce
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag)
    }
  }

  return oldTag.isEqualNode(newTag)
}

function updateElements(type: string, components: JSX.Element[]): void {
  const headEl = document.getElementsByTagName('head')[0]
  const headCountEl: HTMLMetaElement = headEl.querySelector(
    'meta[name=next-head-count]'
  ) as HTMLMetaElement
  if (process.env.NODE_ENV !== 'production') {
    if (!headCountEl) {
      console.error(
        'Warning: next-head-count is missing. https://nextjs.org/docs/messages/next-head-count-missing'
      )
      return
    }
  }

  const headCount = Number(headCountEl.content)
  const oldTags: Element[] = []

  for (
    let i = 0, j = headCountEl.previousElementSibling;
    i < headCount;
    i++, j = j?.previousElementSibling || null
  ) {
    if (j?.tagName?.toLowerCase() === type) {
      oldTags.push(j)
    }
  }
  const newTags = (components.map(reactElementToDOM) as HTMLElement[]).filter(
    (newTag) => {
      for (let k = 0, len = oldTags.length; k < len; k++) {
        const oldTag = oldTags[k]
        if (isEqualNode(oldTag, newTag)) {
          oldTags.splice(k, 1)
          return false
        }
      }
      return true
    }
  )

  oldTags.forEach((t) => t.parentNode?.removeChild(t))
  newTags.forEach((t) => headEl.insertBefore(t, headCountEl))
  headCountEl.content = (headCount - oldTags.length + newTags.length).toString()
}

export default function initHeadManager(): {
  mountedInstances: Set<unknown>
  updateHead: (head: JSX.Element[]) => void
} {
  return {
    mountedInstances: new Set(),
    updateHead: (head: JSX.Element[]) => {
      const tags: Record<string, JSX.Element[]> = {}

      head.forEach((h) => {
        if (
          // If the font tag is loaded only on client navigation
          // it won't be inlined. In this case revert to the original behavior
          h.type === 'link' &&
          h.props['data-optimized-fonts']
        ) {
          if (
            document.querySelector(\`style[data-href="\${h.props['data-href']}"]\`)
          ) {
            return
          } else {
            h.props.href = h.props['data-href']
            h.props['data-href'] = undefined
          }
        }

        const components = tags[h.type] || []
        components.push(h)
        tags[h.type] = components
      })

      const titleComponent = tags.title ? tags.title[0] : null
      let title = ''
      if (titleComponent) {
        const { children } = titleComponent.props
        title =
          typeof children === 'string'
            ? children
            : Array.isArray(children)
            ? children.join('')
            : ''
      }
      if (title !== document.title) document.title = title
      ;['meta', 'base', 'link', 'style', 'script'].forEach((type) => {
        updateElements(type, tags[type] || [])
      })
    },
  }
}
`,
  },
  {
    path: 'some/path/old-tests.ts',
    status: 'modified',
    oldVal: `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
              <Editor />
              <App />
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )
      `,
    newVal: `
      const renderApp = () =>
        ReactDOM.render(
          <React.StrictMode>
            <div>
            </div>
          </React.StrictMode>,
        document.getElementById('root')
      )1
      `,
  },
  {
    path: 'indent-tabs.ts',
    status: 'modified',
    oldVal: `-
\t<P>
\t\t<D>
\t\t<T>
\t</P>
`,
    newVal: `-
{examplesSelect || (
\t\t\t<P>
\t\t\t\t<D>
<T>
\t\t\t</P>
)}
`,
  },
  {
    path: 'indent-123.ts',
    status: 'modified',
    oldVal: `-
\t<P>
\t\t<D>
\t\t<T>
\t</P>
`,
    newVal: `-
{examplesSelect || (
123\t<P>
123\t\t<D>
123\t\t<T>
123\t</P>
)}
`,
  },
  {
    path: 'indent-spaces2.ts',
    status: 'modified',
    newVal: `-
<Text color="body" role="heading">
  Example
  Second
</Text>
`,
    oldVal: `-
{examplesSelect || (
  <Text color="body" role="heading">
    Example
    Second
  </Text>
)}
`,
  },
  {
    path: 'indent-spaces.ts',
    status: 'modified',
    oldVal: `-
<Text color="body" role="heading">
  Example
  Second
</Text>
`,
    newVal: `-
{examplesSelect || (
  <Text color="body" role="heading">
    Example
    Second
  </Text>
)}
`,
  },
  {
    path: 'test.ts',
    status: 'modified',
    oldVal: `ggg
    const renderApp = () =>
      ReactDOM.render(
        <React.StrictMode>
          <div>
            <Editor />
            <App />
          </div>
        </React.StrictMode>,
      document.getElementById('root')
    )
    `,
    newVal: `bla
    const renderApp = () =>
      RaaeactDOM.render(
        <React.StrictMode>
          <div>
            <Editor />
            <Something />
          </div>
        </React.>,
      document.getElementById('hhhh')
    )
    `,
  },
  {
    path: 'onclick',
    status: 'modified',
    oldVal: `
      onClick={() => setIsFullScreen(!isFullScreen)}
      `,
    newVal: `
      onClick={() => {
        setIsFullScreen(!isFullScreen);

        if (visNetwork.current) {
          visNetwork.current.fit();
        }
      }}
      `,
  },
  {
    path: 'testbla.ts',
    status: 'modified',
    oldVal: `
    const renderApp = () =>
      ReactDOM.render(
        <React.StrictMode>
          <div>
            <Editor />
            <App />
          </div>
        </React.StrictMode>,
      document.getElementById('root')
    )
    `,
    newVal: `
    const renderApp = () =>
      ReactDOM.render(
        <Raaeact.StricttMode>
          <div>
          </div>
        </React.StrictMode>,
        kako smo
      document.getElementById('hhhh')
    )
    
    p`,
  },
  {
    path: 'added.ts',
    status: 'added',
    oldVal: '',
    newVal: `added file`,
  },
  {
    path: 'deleted.ts',
    status: 'deleted',
    oldVal: 'deleted file',
    newVal: ``,
  },
  {
    path: 'test2.ts',
    status: 'modified',
    oldVal: `protected _createMouseTarget(e: EditorMouseEvent, testEventTarget: boolean): IMouseTarget {
        return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, testEventTarget ? e.target : null);
      }`,
    newVal: `protected _createMouseTarget(e: EditorMouseEvent, testEventTarget: boolean): IMouseTarget {
        let target = e.target;
        if (!this.viewHelper.viewDomNode.contains(target)) {
          const shadowRoot = dom.getShadowRoot(this.viewHelper.viewDomNode);
          if (shadowRoot) {
            target = (<any>shadowRoot).elementsFromPoint(e.posx, e.posy).find(
              (el: Element) => this.viewHelper.viewDomNode.contains(el)
            );
          }
        }
        return this.mouseTargetFactory.createMouseTarget(this.viewHelper.getLastRenderData(), e.editorPos, e.pos, testEventTarget ? target : null);
      }`,
  },
  {
    path: 'test3.ts',
    status: 'modified',
    oldVal: `        const changeTracker = textChanges.ChangeTracker.fromContext({ host, formatContext, preferences });

    const coalesceAndOrganizeImports = (importGroup: readonly ImportDeclaration[]) => stableSort(
        coalesceImports(removeUnusedImports(importGroup, sourceFile, program, skipDestructiveCodeActions)),
        (s1, s2) => compareImportsOrRequireStatements(s1, s2));

    // All of the old ImportDeclarations in the file, in syntactic order.
    const topLevelImportDecls = sourceFile.statements.filter(isImportDeclaration);
    organizeImportsWorker(topLevelImportDecls, coalesceAndOrganizeImports);

    // All of the old ExportDeclarations in the file, in syntactic order.
    const topLevelExportDecls = sourceFile.statements.filter(isExportDeclaration);`,
    newVal: `        const changeTracker = textChanges.ChangeTracker.fromContext({ host, formatContext, preferences });

    const coalesceAndOrganizeImports = (importGroup: readonly ImportDeclaration[]) => stableSort(
        coalesceImports(removeUnusedImports(importGroup, sourceFile, program, skipDestructiveCodeActions)),
        (s1, s2) => compareImportsOrRequireStatements(s1, s2));

    // All of the old ImportDeclarations in the file, in syntactic order.
    const topLevelImportGroupDecls = groupImportsByNewlineContiguous(sourceFile.statements.filter(isImportDeclaration), host, formatContext);
    topLevelImportGroupDecls.forEach(topLevelImportGroupDecl => organizeImportsWorker(topLevelImportGroupDecl, coalesceAndOrganizeImports));

    // All of the old ExportDeclarations in the file, in syntactic order.
    const topLevelExportDecls = sourceFile.statements.filter(isExportDeclaration);`,
  },
  {
    path: 'test4.ts',
    status: 'modified',
    oldVal: `{
      "name": "@stoplight/elements-dev-portal",
      "version": "1.6.14",
      "description": "UI components for composing beautiful developer documentation.",
      "keywords": [],
      "sideEffects": [
    
        [...devPortalCacheKeys.branchNode(projectId, branch, node), 'details'] as const,
    
      search: () => [...devPortalCacheKeys.all, 'search'],
      searchNodes: (filters: { projectIds?: string[]; workspaceId?: string; search?: string }) => [
        ...devPortalCacheKeys.search(),
        filters,
      ],
    
    });
    
    expect(fetchMock).toBeCalledWith(
      'https://stoplight.io/api/v1/workspaces/my%3Fworkspace/nodes?project_ids[0]=some%2Fslash&search=a%3Fspecial%26search&branchSlug=test%2Bbranch',
      {
        headers: expect.objectContaining({
          'Stoplight-Elements-Version': expect.any(String),
    
    
          if (branchSlug) {
            const encodedBranchSlug = encodeURIComponent(branchSlug);
            queryParams.push(branchSlug=encodedBranchSlug});
          }
        
          const query = queryParams.length ? ?queryParams.join('&')} : '';
    
          search,
          workspaceId,
          projectIds,
          pause,
        }: {
          search: string;
          workspaceId?: string;
          projectIds?: string[];
          pause?: boolean;
        }) {
          const { platformUrl, platformAuthToken } = React.useContext(PlatformContext);
          const [debounceSearch] = useDebounce(search, 500);
          return useQuery(
            [
              ...devPortalCacheKeys.searchNodes({ projectIds, workspaceId, search: debounceSearch }),
              platformUrl,
              platformAuthToken,
            ],
            () => getNodes({ workspaceId, projectIds, search: debounceSearch, platformUrl, platformAuthToken }),
            { enabled: !pause, keepPreviousData: true },
          );
        }`,
    newVal: `{
      "name": "@stoplight/elements-dev-portal",
      "version": "1.6.15",
      "description": "UI components for composing beautiful developer documentation.",
      "keywords": [],
      "sideEffects": [
    
        [...devPortalCacheKeys.branchNode(projectId, branch, node), 'details'] as const,
    
      search: () => [...devPortalCacheKeys.all, 'search'],
      searchNodes: (filters: { projectIds?: string[]; branchSlug?: string; workspaceId?: string; search?: string }) => [
        ...devPortalCacheKeys.search(),
        filters,
      ],
    
    });
    
    expect(fetchMock).toBeCalledWith(
      'https://stoplight.io/api/v1/workspaces/my%3Fworkspace/nodes?project_ids[0]=some%2Fslash&search=a%3Fspecial%26search&branch=test%2Bbranch',
      {
        headers: expect.objectContaining({
          'Stoplight-Elements-Version': expect.any(String),
    
    
          if (branchSlug) {
            const encodedBranchSlug = encodeURIComponent(branchSlug);
            queryParams.push(branch=encodedBranchSlug});
          }
        
          const query = queryParams.length ? ?queryParams.join('&')} : '';
    
          search,
          workspaceId,
          projectIds,
          branch,
          pause,
        }: {
          search: string;
          workspaceId?: string;
          projectIds?: string[];
          branch?: string;
          pause?: boolean;
        }) {
          const { platformUrl, platformAuthToken } = React.useContext(PlatformContext);
          const [debounceSearch] = useDebounce(search, 500);
          return useQuery(
            [
              ...devPortalCacheKeys.searchNodes({ projectIds, branchSlug: branch, workspaceId, search: debounceSearch }),
              platformUrl,
              platformAuthToken,
            ],
            () =>
              getNodes({ workspaceId, projectIds, branchSlug: branch, search: debounceSearch, platformUrl, platformAuthToken }),
            { enabled: !pause, keepPreviousData: true },
          );
        }`,
  },
  {
    path: 'lifecylclehooks.ts',
    status: 'modified',
    oldVal: `
import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

class PubSubTracker {
    private _tracked: Record<string, number> = {};

    public track(name: string): void {
        if (!this._tracked[name]) {
            this._tracked[name] = 0;
        }
        this._tracked[name]++;
    }

    public reset(): void {
        this._tracked = {};
    }

    public isExecutedOnce(name: string): boolean {
        return this._tracked[name] === 1;
    }

    public getExecuted(name: string): number {
        return this._tracked[name] || 0;
    }
}

export const pubSubTracker = new PubSubTracker();

export const assignModelEvents = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.models.onBeforeModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.models.onAfterModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.models.onBeforeModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.models.onAfterModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.models.onBeforeModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.models.onAfterModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.entries.onBeforeEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.entries.onAfterEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.entries.onBeforeEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.entries.onAfterEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.entries.onBeforeEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.entries.onAfterEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.entries.onBeforeEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.entries.onAfterEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.entries.onBeforeEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.entries.onAfterEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.entries.onBeforeEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.entries.onAfterEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.entries.onBeforeEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.entries.onAfterEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.entries.onBeforeEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestReview");
        });
        context.cms.entries.onAfterEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestReview");
        });
        context.cms.entries.onBeforeEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestChanges");
        });
        context.cms.entries.onAfterEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestChanges");
        });
    });
};
`,
    newVal: `
import { CmsContext } from "~/types";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";

class PubSubTracker {
    private _tracked: Record<string, number> = {};

    public track(name: string): void {
        if (!this._tracked[name]) {
            this._tracked[name] = 0;
        }
        this._tracked[name]++;
    }

    public reset(): void {
        this._tracked = {};
    }

    public isExecutedOnce(name: string): boolean {
        return this._tracked[name] === 1;
    }

    public getExecuted(name: string): number {
        return this._tracked[name] || 0;
    }
}

export const pubSubTracker = new PubSubTracker();

export const assignModelEvents = () => {
    return new ContextPlugin<CmsContext>(async context => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onBeforeModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeCreate");
        });
        context.cms.onAfterModelCreate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterCreate");
        });
        context.cms.onBeforeModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeUpdate");
        });
        context.cms.onAfterModelUpdate.subscribe(async () => {
            pubSubTracker.track("contentModel:afterUpdate");
        });
        context.cms.onBeforeModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:beforeDelete");
        });
        context.cms.onAfterModelDelete.subscribe(async () => {
            pubSubTracker.track("contentModel:afterDelete");
        });
    });
};

export const assignEntryEvents = () => {
    return new ContextPlugin<CmsContext>(async (context: CmsContext) => {
        if (!context.cms) {
            throw new Error("Missing cms on context.");
        }
        context.cms.onBeforeEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreate");
        });
        context.cms.onAfterEntryCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreate");
        });
        context.cms.onBeforeEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeCreateRevisionFrom");
        });
        context.cms.onAfterEntryRevisionCreate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterCreateRevisionFrom");
        });
        context.cms.onBeforeEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUpdate");
        });
        context.cms.onAfterEntryUpdate.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUpdate");
        });
        context.cms.onBeforeEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDelete");
        });
        context.cms.onAfterEntryDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDelete");
        });
        context.cms.onBeforeEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeDeleteRevision");
        });
        context.cms.onAfterEntryRevisionDelete.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterDeleteRevision");
        });
        context.cms.onBeforeEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforePublish");
        });
        context.cms.onAfterEntryPublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterPublish");
        });
        context.cms.onBeforeEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeUnpublish");
        });
        context.cms.onAfterEntryUnpublish.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterUnpublish");
        });
        context.cms.onBeforeEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestReview");
        });
        context.cms.onAfterEntryRequestReview.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestReview");
        });
        context.cms.onBeforeEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:beforeRequestChanges");
        });
        context.cms.onAfterEntryRequestChanges.subscribe(async () => {
            pubSubTracker.track("contentEntry:afterRequestChanges");
        });
    });
};
`,
  },
  {
    path: 'diffLineChar.ts',
    status: 'modified',
    oldVal: `
import { get } from "https";
import { CloudFrontRequestEvent } from "~/lambdaEdge";
import { configPath } from "./common";
import { logDebug } from "./log";

// Config is locally cached within live lambda for a short time (1 minute).
// Config must be cached per domain.
// Otherwise cache will spill over different apps, because we may share this lambda.
const configCache = new Map<string, GatewayConfigCache>();

interface GatewayConfigCache {
    config: GatewayConfig;
    timestamp: number;
}

export interface VariantConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, VariantConfig>;

/**
 * Loads traffic splitting config.
 * It will, however not call WCP directly, but serve it from a locally cached file,
 * as explained here https://www.notion.so/webiny/How-traffic-config-is-cached-2c8db57ca2b547a2b2fb1adf378cd191
 */
export async function loadTrafficSplittingConfig(event: CloudFrontRequestEvent) {
    // Retrieve domain of the CloudFront distribution.
    // We need it to make sure we cache config per application.
    // For example API and website could share the same lambda instance.
    // So we cache it separately for each domain (each CloudFront).
    const domain = event.Records[0].cf.config.distributionDomainName;

    let config = configCache.get(domain);
    if (!config || isCacheExpired(config.timestamp)) {
        logDebug("No config in cache");
        config = {
            config: await loadConfigCore(domain),
            timestamp: Date.now()
        };

        configCache.set(domain, config);
    }

    return config.config;
}

function loadConfigCore(domain: string) {
    return new Promise<GatewayConfig>((resolve, reject) => {
        let dataString = "";

        const req = get(
            {
                hostname: domain,
                port: 443,
                path: configPath
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(JSON.parse(dataString));
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message
            });
        });
    });
}

function isCacheExpired(timestamp: number) {
    const ttl = 60 * 1000; // 1 minute
    return Date.now() - timestamp > ttl;
}`,
    newVal: `
import { get } from "https";
import { CloudFrontRequestEvent } from "~/lambdaEdge";
import { logDebug } from "./log";

// Config file has a fixed URL within CDN, so it can be properly cached.
// This way we achieve better performance, because CDN does not have to call WCP API for config every time,
// but it can use it's own cache for a lookup.
const configPath = "/_config";

// Config is locally cached within live lambda for a short time (1 minute).
// Config must be cached per domain.
// Otherwise cache will spill over different apps, because we may share this lambda.
const configCache = new Map<string, GatewayConfigCache>();

interface GatewayConfigCache {
    config: GatewayConfig;
    timestamp: number;
}

export interface VariantConfig {
    domain: string;
    weight: number;
}

export type GatewayConfig = Record<string, VariantConfig>;

/**
 * Loads traffic splitting config.
 * It will, however not call WCP directly, but serve it from a locally cached file,
 * as explained here https://www.notion.so/webiny/How-traffic-config-is-cached-2c8db57ca2b547a2b2fb1adf378cd191
 */
export async function loadTrafficSplittingConfig(event: CloudFrontRequestEvent) {
    // Retrieve domain of the CloudFront distribution.
    // We need it to make sure we cache config per application.
    // For example API and website could share the same lambda instance.
    // So we cache it separately for each domain (each CloudFront).
    const domain = event.Records[0].cf.config.distributionDomainName;

    let config = configCache.get(domain);
    if (!config || isCacheExpired(config.timestamp)) {
        logDebug("No config in cache");
        config = {
            config: await loadConfigCore(domain),
            timestamp: Date.now()
        };

        configCache.set(domain, config);
    }

    return config.config;
}

function loadConfigCore(domain: string) {
    return new Promise<GatewayConfig>((resolve, reject) => {
        let dataString = "";

        const req = get(
            {
                hostname: domain,
                port: 443,
                path: configPath
            },
            function (res) {
                res.on("data", chunk => {
                    dataString += chunk;
                });
                res.on("end", () => {
                    resolve(JSON.parse(dataString));
                });
            }
        );

        req.on("error", e => {
            reject({
                statusCode: 500,
                body: e.message
            });
        });
    });
}

 isCacheExpired(timestamp: numbers) {
    const ttl = 60 * 1000; // 1 minute
    return Date.now() - timestamp > ttl;
}`,
  },
  {
    path: 'diffLineChar2.ts',
    status: 'modified',
    oldVal: `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { buildCloudFrontFunction, buildLambdaEdge } from "@webiny/project-utils";

export function createLambdas(app: PulumiApp) {
    const role = app.addResource(aws.iam.Role, {
        name: 'lambda-edge-role',
        config: {
            managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.LambdaPrincipal,
                        Effect: "Allow"
                    },
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const functions = app.addHandler(() => {
        // Some resources _must_ be put in us-east-1, such as Lambda at Edge,
        // so we need to pass provider to resource options.
        // The problem is, pulumi does not allow to pass provider as 'pulumi.Output',
        // it has to be a created instance.
        // This is why we run the code inside 'app.addHandler' wrapper.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const viewerRequest = createCloudfrontFunction("viewerRequest");
        const viewerResponse = createCloudfrontFunction("viewerResponse");
        const originRequest = createLambdaEdge("originRequest", awsUsEast1, role.output);
        const adminOriginRequest = createLambdaEdge("adminOriginRequest", awsUsEast1, role.output);

        return {
            viewerRequest,
            viewerResponse,
            originRequest,
            adminOriginRequest
        };
    });

    return {
        role,
        functions
    };
}

function createLambdaEdge(name: string, provider: aws.Provider, role: pulumi.Output<aws.iam.Role>) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildLambdaEdge(file);

    return new aws.lambda.Function(
        name,
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.default",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(output.then(o => o.code))
            })
        },
        { provider }
    );
}

function createCloudfrontFunction(name: string) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildCloudFrontFunction(file);

    return new aws.cloudfront.Function(name, {
        runtime: "cloudfront-js-1.0",
        code: output.then(o => o.code)
    });
}    
`,
    newVal: `
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { buildCloudFrontFunction, buildLambdaEdge } from "@webiny/project-utils";

export function createLambdas(app: PulumiApp) {
    const role = app.addResource(aws.iam.Role, {
        name: 'lambda-edge-role',
        config: {
            managedPolicyArns: [aws.iam.ManagedPolicies.AWSLambdaBasicExecutionRole],
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.LambdaPrincipal,
                        Effect: "Allow"
                    },
                    {
                        Action: "sts:AssumeRole",
                        Principal: aws.iam.Principals.EdgeLambdaPrincipal,
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const functions = app.addHandler(() => {
        // Some resources _must_ be put in us-east-1, such as Lambda at Edge,
        // so we need to pass provider to resource options.
        // The problem is, pulumi does not allow to pass provider as 'pulumi.Output',
        // it has to be a created instance.
        // This is why we run the code inside 'app.addHandler' wrapper.
        const awsUsEast1 = new aws.Provider("us-east-1", { region: "us-east-1" });

        const viewerRequest = createCloudfrontFunction("viewerRequest");
        const viewerResponse = createCloudfrontFunction("viewerResponse");
        const originRequest = createLambdaEdge("originRequest", awsUsEast1, role.output);
        const adminOriginRequest = createLambdaEdge("adminOriginRequest", awsUsEast1, role.output);
        // This lambda is responsible for fetching traffic splitting config from WCP
        // and caching it inside CloudFront cache.
        const configOriginRequest = createLambdaEdge(
            "configOriginRequest",
            awsUsEast1,
            role.output
        );

        return {
            viewerRequest,
            viewerResponse,
            originRequest,
            adminOriginRequest,
            configOriginRequest
        };
    });

    return {
        role,
        functions
    };
}

function createLambdaEdge(name: string, provider: aws.Provider, role: pulumi.Output<aws.iam.Role>) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildLambdaEdge(file);

    return new aws.lambda.Function(
        name,
        {
            publish: true,
            runtime: "nodejs14.x",
            handler: "index.default",
            role: role.arn,
            timeout: 5,
            memorySize: 128,
            code: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(output.then(o => o.code))
            })
        },
        { provider }
    );
}

function createCloudfrontFunction(name: string) {
    const file = '@webiny/aws-helpers/stagedRollouts/functions/';
    const output = buildCloudFrontFunction(file);

    return new aws.cloudfront.Function(name, {
        runtime: "cloudfront-js-1.0",
        code: output.then(o => o.code)
    });
}    
`,
  },
];
