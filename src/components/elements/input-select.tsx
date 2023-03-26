import { Transition } from "@headlessui/react";
import { useEventListener } from "@hooks/useEventListener";
import {
  ChangeEvent,
  ComponentProps,
  forwardRef,
  PropsWithChildren,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

type InputSelectProps = Omit<
  PropsWithChildren<ComponentProps<"input">>,
  "value" | "onChange" | "ref" | "onKeyDown"
> & {
  value?: string | number | undefined;
  onChange?: (
    e: ChangeEvent<HTMLSelectElement> | ChangeEvent<HTMLInputElement>
  ) => void;
  position?: "before" | "after";
  label?: string;
};

export const InputSelect = forwardRef<HTMLInputElement, InputSelectProps>(
  (
    {
      children,
      value,
      onChange,
      position = "after",
      label = "Choisir",
      ...props
    },
    ref
  ) => {
    const [select, setSelect] = useState<string | number | undefined>(value);
    const choisir = useId();
    const [input, setInput] = useState<string | undefined>("");

    const [mode, setMode] = useState<"SELECT" | "INPUT">("SELECT");
    const sref = useRef<HTMLSelectElement>(null);
    const [iref, subscribe, cleanup] = useEventListener<HTMLInputElement>(
      "focusout",
      (ref) => {
        if (!ref.current.value) {
        } else {
          const value = ref.current.value;
          if (sref.current && ref.current.checkValidity()) {
            const options = sref.current.options;
            let ok = true;
            for (const option of options) {
              if (option.value == value) {
                ok = false;
                sref.current.value = value;

                // Trigger the change event to React
                const event = new Event("change", { bubbles: true });
                sref.current.dispatchEvent(event);
                break;
              }
            }
            if (ok) {
              const opt = document.createElement("option");
              opt.value = value;
              opt.text = value;
              sref.current.options.add(opt, options.length - 1);
              sref.current.value = value;
              // Trigger the change event to React
              const event = new Event("change", { bubbles: true });
              sref.current.dispatchEvent(event);
            }
          }
        }
        setInput("");
        setMode("SELECT");
      }
    );
    useEffect(() => {
      subscribe();
      return () => {
        cleanup();
      };
    }, [iref]);

    const [hidden, setHidden] = useState(value ?? "");
    // Remove type for the hidden input
    const { type, ...hiddenProps } = props;
    return (
      <>
        <input ref={ref} type="hidden" value={hidden} {...hiddenProps} />
        <input
          ref={iref}
          {...props}
          value={input}
          onKeyDown={(e) => {
            if (!iref.current) return;
            if (e.key === "Enter") {
            } else return;
            setMode("SELECT");
          }}
          onChange={(e) => {
            if (onChange) onChange(e);
            setInput(e.target.value);
          }}
          style={{
            ...props.style,
            display: mode === "INPUT" ? "inherit" : "none",
          }}
          className={props.className}
        />
        <select
          id="rounds"
          ref={sref}
          value={select}
          onChange={(e) => {
            if (e.target.value === choisir) {
              setMode("INPUT");

              // FlushSync is weird
              setTimeout(() => {
                e.target.blur();
                if (iref.current) {
                  iref.current.focus();
                }
              }, 0);
              return;
            } else {
              if (onChange) onChange(e);
              setHidden(e.target.value);
            }
            setSelect(e.target.value);
          }}
          style={{
            ...props.style,
            display: mode === "SELECT" ? "inherit" : "none",
          }}
          className={props.className}
        >
          {position === "before" && <option value={choisir}>{label}</option>}
          {children}
          {position === "after" && <option value={choisir}>{label}</option>}
        </select>
      </>
    );
  }
);
