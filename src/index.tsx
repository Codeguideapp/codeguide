import React from 'react'
import ReactDOM from 'react-dom'
import './index.css'
import { Timeline } from './Timeline/Timeline'
import { Editor } from './Editor/Editor'
import reportWebVitals from './reportWebVitals'
import type * as monaco from 'monaco-editor'

const renderApp = () =>
  ReactDOM.render(
    <React.StrictMode>
      <div>
        <Editor />
        <Timeline />
      </div>
    </React.StrictMode>,
    document.getElementById('root')
  )

// to avoid dealing with monaco and webpack I am using amd version
// taken from https://github.com/microsoft/monaco-editor-samples/blob/main/browser-amd-editor/index.html
// monaco is loaded in index.html and monacoReady event is triggered when loaded
declare global {
  interface Window {
    monacoLoaded: boolean
    monaco: typeof monaco
  }
}
if (window.monacoLoaded) {
  renderApp()
} else {
  document.addEventListener('monacoReady', renderApp)
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
