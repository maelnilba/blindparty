import { Popover, Transition } from "@headlessui/react";
import {
  Children,
  ComponentProps,
  Fragment,
  isValidElement,
  JSXElementConstructor,
  ReactElement,
  ReactFragment,
  ReactNode,
  ReactPortal,
  useEffect,
  useRef,
  useState,
} from "react";

type Element =
  | string
  | number
  | ReactElement<any, string | JSXElementConstructor<any>>
  | ReactFragment
  | ReactPortal;

type TooltipProps = {
  children: ReactNode;
  timeoutDuration?: number;
};
export const Tooltip = (props: TooltipProps) => {
  let timeout: NodeJS.Timeout;
  const { timeoutDuration = 400 } = props;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [openState, setOpenState] = useState(false);

  const toggleMenu = (open: boolean) => {
    setOpenState((openState) => !openState);
    (buttonRef?.current as any as HTMLButtonElement)?.click();
  };

  const onHover = (open: boolean, action: "onMouseEnter" | "onMouseLeave") => {
    if (
      (!open && !openState && action === "onMouseEnter") ||
      (open && openState && action === "onMouseLeave")
    ) {
      clearTimeout(timeout);
      timeout = setTimeout(() => toggleMenu(open), timeoutDuration);
    }
  };

  const handleClick = (open: boolean) => {
    setOpenState(!open); // toggle open state in React state
    clearTimeout(timeout); // stop the hover timer if it's running
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (
      buttonRef.current &&
      !(buttonRef.current as any as HTMLButtonElement).contains(
        event.target as any
      )
    ) {
      event.stopPropagation();
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [bProps, content] = Children.toArray(props.children).reduce<
    [ComponentProps<"button"> | null | undefined, Element[]]
  >(
    (prev, child) => {
      if (isValidElement(child)) {
        if (child.type === "button") {
          const { ref, onClick, ...childProps } =
            child.props as ComponentProps<"button">;
          prev[0] = childProps;
        } else {
          prev[1].push(child);
        }
      }
      return prev;
    },
    [null, []]
  );

  return (
    <Popover className="relative">
      {({ open }) => (
        <div
          onMouseEnter={() => onHover(open, "onMouseEnter")}
          onMouseLeave={() => onHover(open, "onMouseLeave")}
        >
          <Popover.Button
            ref={buttonRef}
            onClick={() => handleClick(open)}
            style={{ ...bProps?.style, outline: "none" }}
            {...bProps}
          />

          <Transition
            show={open}
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel static className="z-100 relative">
              {content}
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  );
};
