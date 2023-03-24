import { useCountdown } from "@hooks/useCountdown";
import { RouterOutputs } from "@utils/api";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";
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
    const timer = useRef<NodeJS.Timeout | null>(null);
    const { count, start, stop } = useCountdown(tracktimer);
    const audio = useRef<HTMLAudioElement | null>(null);
    const range = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      start: async () => {
        setState("LOADING");
        await start();
        setState("RUNNING");
        if (audio.current) {
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
    }));

    return (
      <div className="flex h-full w-full flex-col gap-4">
        <div className="scrollbar-hide relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded border border-gray-800">
          {state === "LOADING" && (
            <p className="z-10 scale-150 text-9xl font-extrabold">{count}</p>
          )}
          <TrackBluredPicture track={track} />
          {track?.preview_url && (
            <>
              <audio ref={audio} className="invisible opacity-0">
                <source src={track.preview_url} />
              </audio>
            </>
          )}
        </div>
        <div className="relative h-2 w-full rounded-lg border border-gray-800 bg-black ">
          <div
            ref={range}
            style={{ width: "100%" }}
            className={`absolute top-0 left-0 h-2 rounded-lg bg-white transition-all`}
          ></div>
        </div>
      </div>
    );
  }
);
