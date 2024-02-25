import { SpeakerIcon } from "@components/icons/speaker";
import * as Slider from "@radix-ui/react-slider";
import clsx from "clsx";
import { percent } from "helpers/math";
import {
  ComponentProps,
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { VolumeData } from "./audio-player";

export const usePlayerVolumeStore = create(
  persist<{
    volume: number;
    setVolume: (volume: number) => void;
    muted: boolean;
    setMuted: (muted: boolean) => void;
  }>(
    (set) => ({
      volume: 0,
      setVolume: (volume) => set({ volume }),
      muted: false,
      setMuted: (muted) => set({ muted }),
    }),
    {
      name: "settings-player",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export type VolumeRef = {
  changeValue: (value: number[]) => void;
};
type VolumeTrackerProps = Omit<ComponentProps<typeof Slider.Root>, "value"> & {
  muted?: boolean;
};
export const VolumeTracker = forwardRef<VolumeRef, VolumeTrackerProps>(
  ({ className, muted, defaultValue, onValueChange, ...props }, forwardRef) => {
    const [value, setValue] = useState<number[] | undefined>(defaultValue);

    useImperativeHandle(
      forwardRef,
      () => ({ changeValue: (value) => setValue(value) }),
      []
    );

    return (
      <Slider.Root
        value={value}
        data-muted={muted}
        onValueChange={(value) => {
          setValue(value);
          onValueChange?.(value);
        }}
        className={twMerge(
          clsx(
            className,
            "group relative flex items-center active:cursor-pointer data-[orientation='horizontal']:h-10 data-[orientation='vertical']:h-full data-[orientation='horizontal']:w-full data-[orientation='vertical']:w-10 data-[orientation='horizontal']:flex-row data-[orientation='vertical']:flex-col"
          )
        )}
        {...props}
      >
        <Slider.Track className="relative flex-grow rounded border border-gray-800 bg-black ring-1 ring-white/20 transition-all group-data-[orientation='horizontal']:h-2.5 group-data-[orientation='vertical']:w-2.5">
          <Slider.Range className="absolute z-20 block rounded bg-white transition-all group-hover:bg-orange-500 group-focus:bg-orange-500 group-data-[muted=true]:hidden group-data-[orientation='horizontal']:h-full group-data-[orientation='vertical']:w-full" />
        </Slider.Track>
        <Slider.Thumb className="block h-0 w-0" aria-label="Volume" />
      </Slider.Root>
    );
  }
);

type VolumeProps = {
  defaultVolume: number;
  setDefaultVolume: (volume: number) => void;
  setDefaultMuted: (muted: boolean) => void;
} & VolumeData &
  ComponentProps<typeof Slider.Root>;
export const Volume = ({
  volume,
  muted,
  setVolume,
  setMuted,
  defaultVolume,
  setDefaultVolume,
  setDefaultMuted,
  className,
  ...props
}: VolumeProps) => {
  const ref = useRef<VolumeRef>(null);
  return (
    <div className={className}>
      <SpeakerIcon
        percent={muted ? 0 : percent(volume, [0, 100])}
        className="h-6 w-6 cursor-pointer transition-all hover:scale-105"
        onClick={() => {
          if (ref.current && volume === 0) {
            ref.current.changeValue([1]);
            setVolume(1);
            setDefaultVolume(1);
            setMuted(false);
            setDefaultMuted(false);
          } else {
            setMuted(!muted);
            setDefaultMuted(!muted);
          }
        }}
      />
      <VolumeTracker
        {...props}
        ref={ref}
        muted={muted}
        min={0}
        max={1}
        step={0.05}
        defaultValue={[defaultVolume]}
        onValueChange={([value]) => {
          if (!(value === undefined)) {
            if (muted) {
              setMuted(false);
              setDefaultMuted(false);
            }
            setVolume(value);
            setDefaultVolume(value);
          }
        }}
      />
    </div>
  );
};
