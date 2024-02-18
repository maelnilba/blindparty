import { Slider, SliderProps } from "@components/elements/slider";
import { SpeakerIcon } from "@components/icons/speaker";
import { usePrevious } from "@hooks/helpers/usePrevious";
import { useClient } from "@hooks/next/useClient";
import { percent } from "helpers/math";
import { Noop } from "helpers/noop";
import { MutableRefObject } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const usePlayerVolumeStore = create(
  persist<{
    volume: number;
    setVolume: (volume: number) => void;
  }>(
    (set) => ({
      volume: 0,
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: "settings-player",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

type VolumeProps = {
  onClick: (state: boolean) => void;
  onValueChange: (value: number, previousValue: number) => void;
} & Omit<
  SliderProps,
  "onClick" | "defaultValue" | "value" | "min" | "max" | "onValueChange"
>;

export const Volume = ({ onClick, onValueChange, ...props }: VolumeProps) => {
  const volume = usePlayerVolumeStore((state) => state.volume);
  const setVolume = usePlayerVolumeStore((state) => state.setVolume);
  const volumewas = usePrevious(volume);

  const isClient = useClient();

  if (!isClient) return <Noop />;

  return (
    <>
      <SpeakerIcon
        percent={percent(volume, [0, 100])}
        className="h-6 w-6 cursor-pointer transition-transform duration-75 hover:scale-105"
        onClick={() => {
          if (volume === 0) setVolume(volumewas || 1);
          else setVolume(0);
          onClick(volume === 0);
        }}
        active={!!volume}
      />
      <Slider
        {...props}
        defaultValue={[volume]}
        value={[volume]}
        min={0}
        max={100}
        onValueChange={(e) => {
          const [value] = e;
          if (value !== undefined) {
            const previous = volume;
            setVolume(value);
            onValueChange(value, previous);
          }
        }}
      />
    </>
  );
};

export function useVolumeAudio(
  audio: MutableRefObject<HTMLAudioElement | null> | undefined
) {
  const mute = () => {
    if (!audio || !audio.current) return;
    audio.current.muted = true;
  };
  const unmute = () => {
    if (!audio || !audio.current) return;
    audio.current.muted = false;
  };
  const speaker = (spk: number, prev: number) => {
    if (!audio || !audio.current) return;
    if (spk === 0 && !!prev) mute();
    if (spk !== 0 && !prev) unmute();
    audio.current.volume = spk / 100;
  };

  return {
    mute,
    unmute,
    speaker,
  };
}
