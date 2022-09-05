import { atom } from 'jotai';

export const windowHeightAtom = atom(window.innerHeight);
export const windowWidthAtom = atom(window.innerWidth);

type Section = 'changedFiles' | 'filesExplorer';
export const activeSectionAtom = atom<Section>('changedFiles');

// currently only one monaco theme can be shown for multiple editors (using monaco for notes)
// using ref object for this because there is no need for atom updates in this case
// https://github.com/microsoft/monaco-editor/issues/338
type MonacoTheme = 'darkInvertedDiff' | 'darkTheme';
export let monacoThemeRef = {
  current: 'darkInvertedDiff' as MonacoTheme,
};
