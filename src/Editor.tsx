import React, { useEffect, useRef } from 'react'

export function Editor() {
  const editorDiv = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorDiv.current) {
      const editor = window.monaco.editor.create(editorDiv.current, {
        value: ['function x() {', '\tconsole.log("Hello world!");', '}'].join(
          '\n'
        ),
        language: 'javascript',
      })
      console.log(editor)
    }
  }, [editorDiv])

  return (
    <div
      ref={editorDiv}
      id="editor"
      style={{
        width: 800,
        height: 400,
      }}
    ></div>
  )
}
