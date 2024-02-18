import { useEventListener } from "@hooks/helpers/useEventListener";
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

export const InputSelect = forwardRef<HTMLSelectElement, InputSelectProps>(
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
    const handle = (target: HTMLInputElement) => {
      if (!target.value) {
      } else {
        const val = target.value;
        if (sref.current && target.checkValidity()) {
          const options = sref.current.options;
          let ok = true;
          for (const option of options) {
            if (option.value == val) {
              ok = false;
              sref.current.value = val;

              // Trigger the change event to React
              const event = new Event("change", { bubbles: true });
              sref.current.dispatchEvent(event);
              break;
            }
          }
          if (ok) {
            const opt = document.createElement("option");
            opt.value = val;
            opt.text = val;
            sref.current.options.add(opt, options.length - 1);
            sref.current.value = val;
            // Trigger the change event to React
            const event = new Event("change", { bubbles: true });
            sref.current.dispatchEvent(event);
          }
        }
      }
      setInput("");
      setMode("SELECT");
    };
    const [iref, subscribe, cleanup] = useEventListener<HTMLInputElement>(
      "focusout",
      (ref) => {
        handle(ref.current);
      }
    );
    useEffect(() => {
      subscribe();
      return () => {
        cleanup();
      };
    }, [iref]);

    // Remove type for the hidden input
    const { type, ...hiddenProps } = props;

    return (
      <>
        <input
          ref={iref}
          {...hiddenProps}
          value={input}
          onKeyDown={(e) => {
            if (!iref.current) return;
            if (e.key === "Enter") {
              e.preventDefault();
              handle(e.target as HTMLInputElement);
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
          ref={sref}
          {...(hiddenProps as any)}
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
