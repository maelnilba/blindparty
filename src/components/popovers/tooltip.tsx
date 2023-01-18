import {
  Fragment,
  useRef,
  useState,
  useEffect,
  LegacyRef,
  Children,
  ReactNode,
  isValidElement,
  ReactElement,
  ReactFragment,
  ReactPortal,
  JSXElementConstructor,
} from "react";
import { Popover, Transition } from "@headlessui/react";

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
    (buttonRef?.current as any as HTMLButtonElement).click();
  };

  // Open the menu after a delay of timeoutDuration
  const onHover = (open: boolean, action: string) => {
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

  const [button, content] = Children.toArray(props.children).reduce<
    [Element | null | undefined, Element[]]
  >(
    (prev, child) => {
      if (isValidElement(child)) {
        if (child.type === "button") {
          prev[0] = child;
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
          <Popover.Button ref={buttonRef} className="outline-none">
            <div onClick={() => handleClick(open)}>{button}</div>
          </Popover.Button>

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
