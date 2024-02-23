import * as Slider from "@radix-ui/react-slider";
import clsx from "clsx";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ComponentProps, PointerEvent, useRef } from "react";
import { twMerge } from "tailwind-merge";

type TimerProps = Omit<
  ComponentProps<typeof Slider.Root>,
  | "orientation"
  | "onLostPointerCapture"
  | "onPointerMove"
  | "onPointerLeave"
  | "min"
  | "max"
  | "step"
  | "defaultValue"
>;
export const Timer = ({ className, ...props }: TimerProps) => {
  const valueChange = useRef<number[]>([]);
  const valueCommit = useRef<number[]>([]);
  const percentage = useMotionValue(0);
  const right = useTransform(percentage, (value) => `${100 - value}%`);

  const calculMousePosition = (e: PointerEvent<HTMLSpanElement>) => {
    const element = e.currentTarget as HTMLSpanElement;
    const { left } = element.getBoundingClientRect();
    return Math.min(
      Math.max(Math.ceil(((e.clientX - left) / element.offsetWidth) * 100), 0),
      100
    );
  };

  return (
    <Slider.Root
      {...props}
      className={twMerge(
        clsx(
          "group relative flex h-10 w-full items-center active:cursor-pointer",
          className
        )
      )}
      defaultValue={[0]}
      min={0}
      max={100}
      step={1}
      orientation="horizontal"
      onValueChange={(value) => {
        valueChange.current = value;
      }}
      onValueCommit={(value) => {
        valueCommit.current = value;
      }}
      onLostPointerCapture={() => {
        if (
          !valueChange.current.every(
            (value, index) => value === valueCommit.current.at(index)
          )
        ) {
          valueCommit.current = valueChange.current;
        }
      }}
      onPointerMove={(e) => percentage.set(calculMousePosition(e))}
      onPointerLeave={() => percentage.set(0)}
    >
      <Slider.Track className="relative h-2.5 flex-grow rounded border border-gray-800 bg-black ring-1 ring-white/20 transition-all group-active:h-3">
        <Slider.Range className="absolute z-20 h-full rounded bg-white transition-colors group-hover:bg-orange-500 group-focus:bg-orange-500" />
        <motion.span
          style={{ right, left: 0 }}
          className="pointer-events-none absolute z-10 block h-full rounded bg-gray-900 transition-all group-active:hidden"
        />
      </Slider.Track>
      <Slider.Thumb className="block h-0 w-0" aria-label="Volume" />
    </Slider.Root>
  );
};
