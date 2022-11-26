import classNames from 'classnames';

import { StepPreview } from '../Guide/getStepPreview';

export function DeltaPreview({ preview }: { preview: StepPreview }) {
  return (
    <div className="delta-preview">
      {Object.entries(preview).map(([line, content]) => (
        <div key={line}>
          <span className="linenumber">{line}:</span>
          {content.map((c, i) => {
            return (
              <span
                key={`${line}-${i}`}
                className={classNames({
                  code: true,
                  highlight: c.isHighlight,
                  deleted: c.isDelete,
                })}
              >
                {c.code}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
