import { faClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import * as monaco from 'monaco-editor';
import React, { useState } from 'react';

interface NewFileDialogProps {
  visible: boolean;
  onCancel: () => void;
  onOk: (fileExtension: string, fileName: string) => void;
}

const languages = monaco.languages.getLanguages();

const fileExtensions = languages
  .filter((language) => language.extensions?.[0])
  .map((language) => language.extensions?.[0]);

export const NewFileDialog: React.FC<NewFileDialogProps> = ({
  visible,
  onCancel,
  onOk,
}) => {
  const [fileExtension, setFileExtension] = useState('.md');
  const [fileName, setFileName] = useState('');
  const [inputError, setInputError] = useState('');

  const handleSubmit = () => {
    if (fileName === '') {
      setInputError('File name cannot be empty.');
    } else {
      setInputError('');
      onOk(fileExtension, fileName);
      setFileName('');
      setFileExtension('.md');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative mx-auto w-full max-w-md rounded bg-neutral-800 p-6 shadow-md">
        <FontAwesomeIcon
          onClick={onCancel}
          icon={faClose}
          className="absolute right-4 top-4 cursor-pointer opacity-60 hover:opacity-100"
        />
        <h2 className="mb-6 text-lg font-semibold">Create New File</h2>

        <div className="mb-6">
          <label className="mb-2 block">File name</label>
          <input
            type="text"
            value={fileName}
            onChange={(e) => {
              setFileName(e.target.value);
              if (e.target.value) {
                setInputError('');
              }
            }}
            onKeyPress={handleKeyPress}
            className={`h-10 w-full rounded bg-neutral-900 px-3 focus:outline-none`}
          />
          {inputError && (
            <p className="mt-1 text-xs text-red-500">{inputError}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="file-extension" className="mb-2 block">
            File extension
          </label>
          <select
            value={fileExtension}
            onChange={(e) => setFileExtension(e.target.value)}
            className="h-10 w-full rounded bg-neutral-900 px-2 focus:outline-none"
          >
            {fileExtensions.map((extension) => (
              <option key={extension} value={extension}>
                {extension}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end">
          <button onClick={onCancel} className="mr-2 px-4 py-2 text-gray-300">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded bg-neutral-900 px-4 py-2 text-white"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
