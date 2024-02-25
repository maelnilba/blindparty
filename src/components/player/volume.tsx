import * as Slider from "@radix-ui/react-slider";
import clsx from "clsx";
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

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

type VolumeProps = ComponentProps<typeof Slider.Root> & { muted?: boolean };
export const Volume = ({ className, muted, ...props }: VolumeProps) => {
  return (
    <Slider.Root
      data-muted={muted}
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
};
