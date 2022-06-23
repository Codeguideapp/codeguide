import { Menu } from 'antd';
import { useAtom } from 'jotai';
import OutsideClickHandler from 'react-outside-click-handler';

import { contextMenuAtom } from '../atoms/layout';

export function ContextMenu() {
  const [contextMenu, setContextMenu] = useAtom(contextMenuAtom);

  if (!contextMenu) return null;

  return (
    <OutsideClickHandler onOutsideClick={() => setContextMenu(undefined)}>
      <div
        style={{
          position: 'absolute',
          top: contextMenu.top,
          left: contextMenu.left,
        }}
      >
        <Menu>
          {contextMenu.items.map((item, i) => (
            <Menu.Item
              onClick={() => {
                item.onClick();
                setContextMenu(undefined);
              }}
              key={i}
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu>
      </div>
    </OutsideClickHandler>
  );
}
