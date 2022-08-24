import type * as monaco from 'monaco-editor';

export const darkThemeInvertedDif: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    {
      background: '181A1C',
      token: '',
    },
  ],
  colors: {
    'editor.background': `#181A1C`,
    'diffEditor.insertedTextBackground': '#ff000060',
    'diffEditor.removedTextBackground': '#9ccc2c33',
    'diffEditor.insertedLineBackground': '#ff000030',
    'diffEditor.removedLineBackground': '#9bb95533',
  },
};

export const darkTheme: monaco.editor.IStandaloneThemeData = {
  base: 'vs-dark',
  inherit: true,
  rules: [
    {
      background: '181A1C',
      token: '',
    },
  ],
  colors: {
    'editor.background': `#181A1C`,
  },
};
