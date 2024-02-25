import {
  Children,
  ComponentProps,
  ComponentPropsWithoutRef,
  createElement,
  isValidElement,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";

export const List = () => <></>;

type ListProps = Omit<ComponentPropsWithoutRef<"ul">, "onKeyDownCapture">;
List.Root = ({ children }: ListProps) => {
  const ref = useRef<HTMLUListElement>(null);
  const [indexFocused, setIndexFocused] = useState(0);

  const items = Children.map(children, (child, index) => {
    if (isValidElement(child) && child.type === List.Item)
      return createElement(child.type, {
        ...child.props,
        tabIndex: index === indexFocused ? 0 : -1,
      });
    return false;
  });

  return (
    <ul
      ref={ref}
      onFocusCapture={(event) => {
        let element = event.target as HTMLElement;
        while (element.parentNode !== null) {
          if (element.parentElement === event.currentTarget) break;
          element = element.parentElement!;
        }
        if (!element.parentNode) return;
        const newIndex = Array.from(event.currentTarget.children).indexOf(
          element
        );

        flushSync(() => {
          if (!ref.current) return;
          const element = ref.current.children.item(newIndex) as
            | HTMLElement
            | undefined;
          if (element) element.focus();
        });
        setIndexFocused(newIndex);
      }}
      onKeyDownCapture={(event) => {
        if (!items || !ref.current) return;
        if (!(event.code === "ArrowUp" || event.code === "ArrowDown")) return;
        event.preventDefault();
        let newIndex = indexFocused;
        newIndex =
          event.code === "ArrowUp"
            ? Math.max(0, indexFocused - 1)
            : Math.min(indexFocused + 1, items.length - 1);

        flushSync(() => {
          if (!ref.current) return;
          const element = ref.current.children.item(newIndex) as
            | HTMLElement
            | undefined;
          if (element) element.focus();
        });
        setIndexFocused(newIndex);
      }}
    >
      {items}
    </ul>
  );
};

type ListItemProps = ComponentProps<"li">;
List.Item = ({ children, ...props }: ListItemProps) => (
  <li {...props}>{children}</li>
);
