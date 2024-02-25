import { Square } from "@components/elements/square-loader";

import { AudioPlayer, useAudioPlayer } from "@components/player/audio-player";
import { useCountdown } from "@hooks/helpers/useCountdown";
import { RouterOutputs } from "@utils/api";
import clsx from "clsx";
import { forwardRef, useImperativeHandle, useState } from "react";
import { TrackBluredPicture } from "./track-picture";

export type TrackPlayerProps = RouterOutputs["party"]["game"]["round"] & {
  tracktimer: number;
};

export type TrackPlayerRef = {
  start: () => void;
  stop: () => void;
};

export const TrackPlayer = forwardRef<TrackPlayerRef, TrackPlayerProps>(
  ({ track, tracktimer }, ref) => {
    const [state, setState] = useState<"PENDING" | "LOADING" | "RUNNING">(
      "PENDING"
    );

    const { ref: audio } = useAudioPlayer();

    const { count, start, stop } = useCountdown(tracktimer);

    useImperativeHandle(ref, () => ({
      start: async () => {
        setState("LOADING");
        await start();
        setState("RUNNING");
        if (audio.current) {
          audio.current.src = track.previewUrl!;
          await audio.current.play();
        }
      },
      stop: () => {
        setState("PENDING");
        if (audio.current) {
          audio.current?.pause();
        }

        stop();
      },
    }));

    return (
      <div className="relative flex h-full w-full flex-col gap-4">
        {state === "LOADING" && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <p className="scale-150 text-9xl font-extrabold">{count}</p>
          </div>
        )}
        <AudioPlayer.Time>
          {({ duration }) => (
            <Square
              className={clsx("scrollbar-hide h-full w-full rounded-lg", {
                "bg-gray-800/50": state === "RUNNING",
              })}
              active={state === "RUNNING"}
              timing="linear"
              speed={duration || 30}
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
                </div>
              </Square.Child>
              <Square.Dash
                className="stroke-white stroke-[3]"
                parent={{ className: "rounded-lg" }}
              />
            </Square>
          )}
        </AudioPlayer.Time>
      </div>
    );
  }
);
