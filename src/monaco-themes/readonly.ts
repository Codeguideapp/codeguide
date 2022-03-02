import type * as monaco from "monaco-editor";

export const readOnlyTheme: monaco.editor.IStandaloneThemeData = {
  base: "vs-dark",
  inherit: true,
  rules: [
    {
      background: "181A1C",
      token: "",
    },
  ],
  colors: {
    "editor.background": "#181A1C",
  },
};
