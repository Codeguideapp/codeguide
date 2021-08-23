import { createYText, sync } from "./edits";
import * as diff from "diff";

test("should apply independent edits", () => {
  const initial = createYText("example text");
  expect(initial.toString()).toBe("example text");

  const text1 = createYText(initial);
  const text2 = createYText(initial);

  text1.insert(0, "1");
  text2.insert(8, "2");

  expect(text1.toString()).toBe("1example text");
  expect(text2.toString()).toBe("example 2text");

  sync(text1, text2);

  expect(text1.toString()).toBe("1example 2text");
  expect(text2.toString()).toBe("1example 2text");
});

test("should diff", () => {
  const oldStr = `const renderApp = () =>
  ReactDOM.render(
    <React.StrictMode>
      <div>
        <Editor />
        <App />
      </div>
    </React.StrictMode>,
  document.getElementById('root')
  )`;
  const newStr = `const renderApp = () =>
  ReactDOM.render(
    <React.StrictMode>
      <span>
        <App />
      </span>
    </React.StrictMode>,
  document.getElementById('something w')
  )
  // new line`;

  const diffs = diff.diffWords(oldStr, newStr) as (Diff.Change & {
    _skip?: boolean;
    replace?: string;
  })[];

  const diffsWithReplace = diffs
    .map((diff, index, all) => {
      if (diff._skip) {
        return false;
      }

      if (diff.removed && all[index + 1]?.added) {
        all[index + 1]._skip = true;

        return {
          removed: true,
          replace: all[index + 1].value,
          value: diff.value,
        };
      }

      return diff;
    })
    .filter((val) => !!val);

  // dodat move diff (pregledat ima li istih valuea jedan add drugi remove)
  // to uvijek ide skupa isto kao i replace

  // calc index za commandu
  // gleda se samo prethodni value.length i ignorira se added

  // dobije se index komande, za add, delete i replace (koji se sastoji od add del)
  // na orig tekst

  // od toga se rade yjs komande i docs
  // i synca

  // rez mora bit ko newdoc

  // let i = 0;
  // for (const diff of diffs) {
  //   if () {
  //     i;
  //   }

  //   i++;
  // }
});
