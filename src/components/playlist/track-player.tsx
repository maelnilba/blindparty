import { PauseIcon } from "@components/icons/pause";
import { PlayIcon } from "@components/icons/play";
import { SpeakerIcon } from "@components/icons/speaker";
import { Picture } from "@components/images/picture";
import { usePrevious } from "@hooks/usePrevious";
import { secondIntl } from "lib/helpers/date";
import { Track } from "pages/dashboard/playlist/#types";
import {
  ComponentProps,
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const usePlayerVolumeStore = create(
  persist<{
    volume: number;
    setVolume: (volume: number) => void;
  }>(
    (set) => ({
      volume: 100,
      setVolume: (volume) => set({ volume }),
    }),
    {
      name: "settings-player",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

type TrackPlayerContext = {
  currentTrack: Track | null;
  playing: boolean;
  load: (track: Track) => Promise<void> | void;
  unload: () => Promise<void> | void;
  start: () => Promise<void> | void;
  pause: () => void;
  unpause: () => void;
  mute: () => void;
  unmute: () => void;
};

const TrackPlayerContext = createContext<TrackPlayerContext>({
  currentTrack: null,
  playing: false,
  load: (t) => {},
  unload: () => {},
  start: () => {},
  pause: () => {},
  unpause: () => {},
  mute: () => {},
  unmute: () => {},
});

export const usePlayer = () => {
  const context = useContext(TrackPlayerContext);
  if (context === undefined) {
    throw new Error(`usePlayer must be used within a TrackPlayer.`);
  }
  return context;
};

export const TrackPlayer = ({
  children,
  ...props
}: Omit<ComponentProps<"div">, "className">) => {
  const [track, setTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const volume = usePlayerVolumeStore((state) => state.volume);
  const setVolume = usePlayerVolumeStore((state) => state.setVolume);
  const muted = !volume;
  const volumewas = usePrevious(volume);

  const audio = useRef<HTMLAudioElement | null>(null);
  const range = useRef<HTMLDivElement | null>(null);
  const currentTime = useRef<HTMLDivElement | null>(null);
  const trackTime = useRef<HTMLDivElement | null>(null);

  const timeupdate = useCallback(
    (e: Event) => {
      const target = e.target as HTMLAudioElement;
      const percent = 100 / (target.duration / target.currentTime);

      if (range.current) {
        range.current.style.width = percent.toFixed() + "%";
      }
      if (!currentTime.current) return;
      currentTime.current.innerText = secondIntl(
        Math.floor(target.currentTime) + 1,
        "mm:ss"
      );
    },
    [currentTime]
  );

  const ended = (e: Event) => {
    if (!audio.current) return;
    setPlaying(false);
    audio.current.pause();
    audio.current.currentTime = 0;
  };
  const pause = () => {
    if (!audio.current) return;
    audio.current.pause();
    setPlaying(false);
  };
  const unpause = () => {
    if (!audio.current) return;
    audio.current.play();
    setPlaying(true);
  };
  const mute = () => {
    setVolume(0);
    if (!audio.current) return;
    audio.current.muted = true;
  };
  const unmute = () => {
    setVolume(volumewas ?? 100);
    if (!audio.current) return;
    audio.current.muted = false;
  };
  const speaker = (spk: number) => {
    if (!audio.current) return;
    if (spk === 0 && !muted) mute();
    if (spk !== 0 && muted) unmute();
    setVolume(spk);
    audio.current.volume = spk / 100;
  };
  const toggle = () => {
    if (playing) pause();
    else unpause();
  };
  useHotkeys("space", () => toggle(), [playing]);

  const goto = (seconds: number) => {
    if (!audio.current) return;
    audio.current.currentTime = seconds;
  };
  const value: TrackPlayerContext = {
    currentTrack: track,
    playing: playing,
    load: async (track: Track) => {
      return new Promise((r) => {
        setTrack(track);
        r();
      }) as Promise<void>;
    },
    start: async () => {
      if (!audio.current) return;
      setPlaying(true);
      audio.current.volume = volume / 100;
      audio.current.muted = !volume;

      await audio.current.play();
      if (!trackTime.current) return;
      trackTime.current.innerText = secondIntl(
        Math.floor(audio.current.duration) + 1,
        "mm:ss"
      );
      audio.current.addEventListener("timeupdate", timeupdate);
      audio.current.addEventListener("ended", ended);
    },
    unload: () => {
      setTrack(null);
      if (!audio.current) return;

      audio.current.removeEventListener("timeupdate", timeupdate);
      audio.current.removeEventListener("ended", ended);
    },
    pause: pause,
    unpause: unpause,
    mute: mute,
    unmute: unmute,
  };

  return (
    <TrackPlayerContext.Provider value={value}>
      {children}
      <div
        {...props}
        className="fixed bottom-0 bg-black/5 backdrop-blur-sm"
        style={{ width: "100%" }}
      >
        <div className="grid w-full grid-cols-12 border-t-2 border-gray-800 p-2">
          <div className="col-span-3 flex items-center justify-center gap-4 px-[1.75rem]">
            {track && (
              <>
                <Picture
                  className="group/image relative"
                  identifier={track?.album.images[0]?.url}
                >
                  <img
                    alt={`track picture of ${track.name}`}
                    src={track?.album.images[0]?.url}
                    className="h-12 w-12 rounded-sm border-gray-800 transition-all duration-75 group-hover/item:scale-105 group-hover/image:opacity-75"
                  />
                </Picture>
                <div className="inline-block w-3/4">
                  <span
                    title={track.name}
                    className="block overflow-hidden truncate text-ellipsis font-extrabold"
                  >
                    {track.name}
                  </span>
                  <span
                    title={track.artists.map((a) => a.name).join(", ")}
                    className="block overflow-hidden truncate text-ellipsis"
                  >
                    {track.artists.map((a) => a.name).join(", ")}
                  </span>
                </div>
              </>
            )}
          </div>
          <div className="col-span-6 flex flex-col items-center justify-center gap-2">
            {track?.preview_url && (
              <>
                <audio
                  key={track.id}
                  ref={audio}
                  className="invisible h-0 opacity-0"
                >
                  <source src={track.preview_url} />
                </audio>
              </>
            )}
            {!playing ? (
              <div
                onClick={unpause}
                className="cursor-pointer rounded-full bg-white p-2.5 transition-transform duration-75 hover:scale-105"
              >
                <PlayIcon className="h-6 w-6 text-black" />
              </div>
            ) : (
              <div
                onClick={pause}
                className="cursor-pointer rounded-full bg-white p-2.5 transition-transform duration-75 hover:scale-105"
              >
                <PauseIcon className="h-6 w-6 text-black" />
              </div>
            )}
            <div className="flex h-4 w-full items-center justify-center gap-2">
              <div className="min-w-[2rem] text-xs" ref={currentTime}>
                 
              </div>
              <div className="relative h-2 flex-1 cursor-pointer rounded-lg border border-gray-800 bg-black">
                <div className="flex">
                  {Array(60)
                    .fill(null)
                    .map((_, i) => (
                      <span
                        key={i}
                        onClick={() => goto(i / 2)}
                        className="h-2 flex-1"
                      ></span>
                    ))}
                </div>
                <div
                  ref={range}
                  style={{ width: "0%" }}
                  className={`pointer-events-none absolute top-0 left-0 h-2 rounded-lg bg-white transition-all`}
                ></div>
              </div>
              <div className="min-w-[2rem] text-xs" ref={trackTime}>
                 
              </div>
            </div>
          </div>
          <div className="col-span-3 flex items-center justify-center gap-2">
            <SpeakerIcon
              className="h-6 w-6 cursor-pointer transition-transform duration-75 hover:scale-105"
              onClick={() => {
                volume === 0 ? unmute() : mute();
              }}
              active={!muted}
            />
            <input
              value={volume}
              type="range"
              className="no-thumb-range bg-black accent-gray-100"
              min={0}
              max={100}
              onChange={(e) => speaker(e.target.valueAsNumber)}
            />
          </div>
        </div>
      </div>
    </TrackPlayerContext.Provider>
  );
};
