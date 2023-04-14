import { faClose, faCopy } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'antd';
import copy from 'copy-to-clipboard';
import React, { useState } from 'react';

import { LoadingIcon } from '../svgIcons/LoadingIcon';

interface NewFileDialogProps {
  visible: boolean;
  uploadedImgUrl?: string;
  error?: string;
  onCancel: () => void;
}

export const ImageUploadDialog: React.FC<NewFileDialogProps> = ({
  visible,
  uploadedImgUrl,
  error,
  onCancel,
}) => {
  const [tooltipContent, setTooltipContent] = useState('Copy to clipboard');

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
      <div className="relative mx-auto w-full max-w-md rounded bg-neutral-800 p-6 shadow-md">
        <FontAwesomeIcon
          onClick={onCancel}
          icon={faClose}
          className="absolute right-4 top-4 cursor-pointer opacity-60 hover:opacity-100"
        />
        <h2 className="mb-6 text-lg font-semibold">
          {uploadedImgUrl ? 'Image uploaded successfully!' : 'Image Upload'}
        </h2>

        <div className="mb-6">
          <label className="mb-2 block">
            {error ? (
              error
            ) : uploadedImgUrl ? (
              <div>
                <div>You can use this in your markdown file:</div>
                <div className="flex items-center gap-2">
                  <pre className="my-2 grow overflow-auto rounded bg-neutral-700 p-2 text-xs outline-none">
                    {`![image](${uploadedImgUrl})`}
                  </pre>
                  <Tooltip title={tooltipContent}>
                    <FontAwesomeIcon
                      className="cursor-pointer"
                      icon={faCopy}
                      onClick={() => {
                        copy(`![image](${uploadedImgUrl})`);
                        setTooltipContent('Copied!');
                      }}
                    />
                  </Tooltip>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LoadingIcon />
                <div>Uploading image...</div>
              </div>
            )}
          </label>
        </div>
      </div>
    </div>
  );
};
