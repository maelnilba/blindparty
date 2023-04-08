import { useClickOutside } from "@hooks/helpers/useClickOutside";
import { InputHTMLAttributes, ReactNode, useRef, useState } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  children: ReactNode;
}
export const InputFade = ({ children, ...props }: InputProps) => {
  const [active, setActive] = useState(false);
  const ipRef = useRef<HTMLInputElement | null>(null);
  const [ref, subscribe, cleanup] = useClickOutside<HTMLDivElement>(() => {
    if (ipRef.current && !ipRef.current.value) {
      setActive(false);
      cleanup();
      animation({ action: "STOP" });
    }
  });

  // CSS and framer-motion don't do smooth transition between border-radius
  // Should use how fix it instead of using this function
  const animation = ({ action }: { action: "START" | "STOP" }) => {
    if (ref.current) {
      let count = +ref.current!.style.borderRadius.replace("px", "");
      let timer = setInterval(() => {
        const borderRadius = +ref.current!.style.borderRadius.replace("px", "");
        if (action === "START" ? borderRadius < 9 : borderRadius > 15) {
          clearInterval(timer);
        } else {
          ref.current!.style.borderRadius =
            action === "START" ? count-- + "px" : count++ + "px";
        }
      }, 10);
    }
  };

  return (
    <div
      ref={ref}
      onClick={() => {
        if (ipRef.current && !ipRef.current.value) {
          setActive(true);
          subscribe();
          animation({ action: "START" });
        }
      }}
      style={{ borderRadius: "16px" }}
      className={`${
        ipRef.current && ipRef.current.value ? "pointer-events-none" : ""
      } relative w-full px-6 py-1 text-center text-lg font-semibold no-underline ring-2 ring-white ring-opacity-5`}
    >
      <input
        ref={ipRef}
        className="pointer-events-auto absolute top-0 left-0 right-0 mx-auto h-8 w-full rounded-lg bg-transparent px-4 outline-none"
        {...props}
      />
      <span className={`${active ? "opacity-0" : ""} transition-opacity`}>
        {children}
      </span>
    </div>
  );
};
