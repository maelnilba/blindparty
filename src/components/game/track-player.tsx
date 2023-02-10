import { useCountdown } from "@hooks/useCountdown";
import { RouterOutputs } from "@utils/api";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type TrackPlayerProps = RouterOutputs["party"]["game"]["round"];

export type TrackPlayerRef = {
  start: () => void;
  stop: () => void;
};

export const TrackPlayer = forwardRef<TrackPlayerRef, TrackPlayerProps>(
  ({ track, embed }, ref) => {
    const [state, setState] = useState<"PENDING" | "LOADING" | "RUNNING">(
      "PENDING"
    );
    const timer = useRef<NodeJS.Timeout | null>(null);
    const { count, start, stop } = useCountdown(5000);
    const audio = useRef<HTMLAudioElement | null>(null);
    const iframe = useRef<HTMLIFrameElement | null>(null);
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
        if (iframe.current) {
          const button =
            iframe.current.contentWindow?.document.querySelector(
              '[title="Play"]'
            );
          if (button) {
            (button as HTMLButtonElement).click();
          }
        }
      },
      stop: () => {
        if (timer.current) {
          setState("PENDING");
          if (audio.current) {
            audio.current?.pause();
          }
          if (iframe.current) {
            if (iframe.current) {
              const button =
                iframe.current.contentWindow?.document.querySelector(
                  '[title="Play"]'
                );
              if (button) {
                (button as HTMLButtonElement).click();
              }
            }
          }
          stop();
          clearTimeout(timer.current);
        }
      },
    }));

    const image = track?.album.images.filter((i) => i.url).at(0);

    return (
      <div className="flex flex-col gap-4">
        <div className="scrollbar-hide relative flex h-72 w-72 flex-col items-center justify-center overflow-y-auto rounded border border-gray-800">
          {state === "LOADING" && (
            <p className="z-10 text-9xl font-extrabold">{count}</p>
          )}
          {/* <img className="absolute blur-xl" src={image?.url} /> */}
          {/* {track?.preview_url && (
            <>
              <audio ref={audio}>
                <source src={track.preview_url} />
              </audio>
            </>
          )} */}
          <iframe
            ref={iframe}
            src="https://open.spotify.com/embed/track/5lwWpQ71GKN3sWmk8zZr9g"
          ></iframe>
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
