import {
  Children,
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
  createElement,
  forwardRef,
  isValidElement,
  useId,
  useState,
} from "react";
import { flushSync } from "react-dom";

export const List = () => <></>;

type ListProps = Omit<ComponentPropsWithoutRef<"ul">, "onKeyDownCapture">;
List.Root = forwardRef<HTMLUListElement, ListProps>(
  ({ children, ...props }, forwardRef) => {
    const id = useId();
    const [indexFocused, setIndexFocused] = useState(0);

    const items = Children.map(children ?? [], (child) => {
      if (
        isValidElement(child) &&
        (child.type === List.Item || child.type === List.NotItem)
      )
        return child;
      return false;
    })!
      .filter(Boolean)
      .map((child, index) => {
        if (isValidElement(child) && child.type === List.Item)
          return createElement(child.type, {
            ...child.props,
            key: child.key,
            tabIndex: index === indexFocused ? 0 : -1,
          });
        else if (isValidElement(child) && child.type === List.NotItem)
          return child;
        return false;
      });

    return (
      <ul
        {...props}
        ref={forwardRef}
        id={id}
        onPointerDownCapture={(event) => {
          if (event.target === event.currentTarget) return;
          let element = event.target as HTMLElement;

          while (
            element.parentNode !== null ||
            element.parentNode !== undefined
          ) {
            if (element.parentElement === event.currentTarget) break;
            element = element.parentElement!;
          }
          if (!element.parentNode) return;
          const newIndex = Array.from(event.currentTarget.children).indexOf(
            element
          );

          flushSync(() => {
            if (!document.getElementById(id)) return;
            const element = document
              .getElementById(id)!
              .children.item(newIndex) as HTMLElement | undefined;
            if (element) element.focus();
          });
          setIndexFocused(newIndex);
        }}
        onKeyDownCapture={(event) => {
          if (!items || !document.getElementById(id)) return;
          if (!(event.code === "ArrowUp" || event.code === "ArrowDown")) return;
          event.preventDefault();
          let newIndex = indexFocused;
          newIndex =
            event.code === "ArrowUp"
              ? Math.max(0, indexFocused - 1)
              : Math.min(indexFocused + 1, items.length - 1);

          flushSync(() => {
            if (!document.getElementById(id)) return;
            const element = document
              .getElementById(id)!
              .children.item(newIndex) as HTMLElement | undefined;
            if (element) element.focus();
          });
          setIndexFocused(newIndex);
        }}
      >
        {items}
      </ul>
    );
  }
);

type ListItemProps = Omit<ComponentProps<"li">, "children" | "tabIndex"> & {
  children: ((value: { selected: boolean }) => ReactNode) | ReactNode;
  asChild?: boolean;
};
List.Item = ({ children, asChild, ...props }: ListItemProps) => {
  const selected = (props as ComponentProps<"li">).tabIndex === 0;

  return (
    <li {...props} aria-selected={selected}>
      {children instanceof Function ? children({ selected }) : children}
    </li>
  );
};

List.NotItem = ({ children }: { children: ReactNode }) => <>{children}</>;
