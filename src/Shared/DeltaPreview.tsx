import './DeltaPreview.css';

import classNames from 'classnames';

type IDeltaPreview = Record<
  number,
  {
    isDelete: boolean;
    code: string;
  }[]
>;

export function DeltaPreview({ preview }: { preview: IDeltaPreview }) {
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
