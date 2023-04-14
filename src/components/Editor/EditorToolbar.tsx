/* eslint-disable @next/next/no-img-element */
import { library } from '@fortawesome/fontawesome-svg-core';
import {
  faCodeCompare,
  faHighlighter,
  faImage,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Checkbox, Tooltip } from 'antd';
import axios from 'axios';
import { useAtom } from 'jotai';
import { useState } from 'react';

import { ImageUploadDialog } from '../dialogs/ImageUploadDialog';
import { showWhitespaceAtom } from '../store/atoms';
import { useFilesStore } from '../store/files';

library.add(faHighlighter, faCodeCompare);

export function EditorToolbar() {
  const activeFile = useFilesStore((s) => s.activeFile);
  const [showWhitespace, setShowWhitespace] = useAtom(showWhitespaceAtom);
  const [showImageUploadDialog, setShowImageUploadDialog] = useState(false);
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string>();
  const [uploadedImgError, setUploadedImgError] = useState<string>();

  const onImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setShowImageUploadDialog(true);

    try {
      const { data } = await axios.post('/api/imgUpload', {
        name: file.name,
        type: file.type,
      });

      const url = data.url;
      await axios.put(url, file, {
        headers: {
          'Content-type': file.type,
          'Access-Control-Allow-Origin': '*',
        },
      });

      setUploadedImgUrl(data.publicUrl);
    } catch (err) {
      setUploadedImgError('Error uploading image. Please try again.');
      console.error(err);
    }
  };

  return (
    <div className="flex h-full items-center">
      {activeFile?.isFileDiff && (
        <Tooltip title="Show Leading/Trailing Whitespace Differences">
          <img
            width="16"
            src="/icons/whitespace.svg"
            alt=""
            className="mx-2 cursor-pointer"
            style={showWhitespace ? { opacity: 1 } : { opacity: 0.5 }}
            onClick={() => setShowWhitespace(!showWhitespace)}
          />
        </Tooltip>
      )}
      {activeFile?.path.split('.').pop() === 'md' && (
        <Tooltip title="Upload Image">
          <label htmlFor="selectFile" className="cursor-pointer">
            <input
              className="hidden"
              type="file"
              accept="image/*"
              name="image"
              id="selectFile"
              onChange={onImageUpload}
            />
            <FontAwesomeIcon icon={faImage} />
          </label>
        </Tooltip>
      )}
      <ImageUploadDialog
        uploadedImgUrl={uploadedImgUrl}
        visible={showImageUploadDialog}
        error={uploadedImgError}
        onCancel={() => {
          setShowImageUploadDialog(false);
        }}
      />
    </div>
  );
}
