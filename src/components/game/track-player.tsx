import { Square } from "@components/elements/square-loader";

import { useCountdown } from "@hooks/helpers/useCountdown";
import { RouterOutputs } from "@utils/api";
import clsx from "clsx";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { TrackBluredPicture } from "./track-picture";

export type TrackPlayerProps = RouterOutputs["party"]["game"]["round"] & {
  tracktimer: number;
};

export type TrackPlayerRef = {
  start: () => void;
  stop: () => void;
} & ReturnType<typeof useVolumeAudio>;

export const TrackPlayer = forwardRef<TrackPlayerRef, TrackPlayerProps>(
  ({ track, tracktimer }, ref) => {
    const [state, setState] = useState<"PENDING" | "LOADING" | "RUNNING">(
      "PENDING"
    );
    const timer = useRef<NodeJS.Timeout | null>(null);
    const { count, start, stop } = useCountdown(tracktimer);
    const audio = useRef<HTMLAudioElement | null>(null);
    const range = useRef<HTMLDivElement | null>(null);
    const volume = usePlayerVolumeStore((state) => state.volume);

    const volumeAudio = useVolumeAudio(audio);

    useImperativeHandle(ref, () => ({
      start: async () => {
        setState("LOADING");
        await start();
        setState("RUNNING");
        if (audio.current) {
          audio.current.volume = volume / 100;
          audio.current.muted = !volume;
          await audio.current.play();
          // @ts-ignore
          audio.current.addEventListener("timeupdate", (e) => {
            const target = e.target as HTMLAudioElement;
            const percent = 100 / (target.duration / target.currentTime);
            if (range.current) {
              range.current.style.width = (100 - percent).toFixed() + "%";
            }
          });
        }
      },
      stop: () => {
        if (timer.current) {
          setState("PENDING");
          if (audio.current) {
            audio.current?.pause();
          }

          stop();
          clearTimeout(timer.current);
        }
      },
      ...volumeAudio,
    }));

    return (
      <div className="relative flex h-full w-full flex-col gap-4">
        {state === "LOADING" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="scale-150 text-9xl font-extrabold">{count}</p>
          </div>
        )}
        <Square
          className={clsx("scrollbar-hide h-full w-full rounded-lg", {
            "bg-gray-800/50": state === "RUNNING",
          })}
          active={state === "RUNNING"}
          timing="linear"
          speed={30}
        >
          <Square.Child className="h-full w-full flex-col overflow-hidden rounded p-1.5">
            <div
              className={clsx(
                "relative h-full w-full overflow-hidden rounded border-gray-800",
                { "border-0": state === "RUNNING" },
                { bordr: state !== "RUNNING" }
              )}
            >
              <TrackBluredPicture track={track} />
              {track?.previewUrl && (
                <>
                  <audio ref={audio} className="invisible opacity-0">
                    <source src={track.previewUrl} />
                  </audio>
                </>
              )}
            </div>
          </Square.Child>
          <Square.Dash
            className="stroke-white stroke-[3]"
            parent={{ className: "rounded-lg" }}
          />
        </Square>
      </div>
    );
  }
);
