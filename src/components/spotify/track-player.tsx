import { Slider } from "@components/elements/slider";
import { PauseIcon } from "@components/icons/pause";
import { PlayIcon } from "@components/icons/play";
import { SpeakerIcon } from "@components/icons/speaker";
import { Picture } from "@components/images/picture";
import { Track } from "@components/playlist/types";
import { useClient } from "@hooks/useClient";
import { usePrevious } from "@hooks/usePrevious";
import { noop } from "@lib/helpers/noop";
import { secondIntl } from "lib/helpers/date";
import { useRouter } from "next/router";
import {
  ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Volume, usePlayerVolumeStore, useVolumeAudio } from "./volume";

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
  unload: noop,
  start: noop,
  pause: noop,
  unpause: noop,
  mute: noop,
  unmute: noop,
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

  const audio = useRef<HTMLAudioElement | null>(null);

  const [range, setRange] = useState(0);
  const moving = useRef(false);
  const currentTime = useRef<HTMLDivElement | null>(null);
  const trackTime = useRef<HTMLDivElement | null>(null);

  const timeupdate = useCallback(
    (e: Event) => {
      if (moving.current) return;

      const target = e.target as HTMLAudioElement;
      setRange(target.currentTime);
      if (!currentTime.current) return;
      currentTime.current.innerText = secondIntl(
        Math.floor(target.currentTime) + 1,
        "mm:ss"
      );
    },
    [currentTime, moving]
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

  const { mute, unmute, speaker } = useVolumeAudio(audio);

  const toggle = () => {
    if (playing) pause();
    else unpause();
  };

  useHotkeys("space", () => toggle(), [playing], {
    enableOnFormTags: false,
    preventDefault: true,
  });

  const goto = (seconds: number) => {
    if (!audio.current) return;
    audio.current.currentTime = seconds;
    setRange(seconds);
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

  const router = useRouter();
  useEffect(() => {
    let slow: NodeJS.Timer | undefined;
    let done = false;
    const handleRouteChange = (url: string, opts: { shallow: boolean }) => {
      if (done) return true;
      if (!audio.current) return true;
      if (!playing) return;
      // Might find a way to descrease volume in inscreasing way
      let count = 0;
      slow = setInterval(() => {
        if (!audio.current) return true;
        if (!audio.current.muted) {
          audio.current.volume = Math.max(0.1, audio.current.volume - 0.1);
        }

        count++;
        if (count > 9) {
          clearInterval(slow);
          done = true;
          router.push(url, undefined, opts);
        }
      }, 25);

      router.events.emit("routeChangeError");
      throw "Process to slow down song.";
    };

    router.events.on("routeChangeStart", handleRouteChange);
    return () => {
      router.events.off("routeChangeStart", handleRouteChange);
      slow && clearInterval(slow);
    };
  }, [playing]);

  const image = track?.album.images[0];

  return (
    <TrackPlayerContext.Provider value={value}>
      {children}
      <div
        {...props}
        className="fixed bottom-0 z-50 bg-black/5 backdrop-blur-sm"
        style={{ width: "100%" }}
      >
        <div className="grid w-full grid-cols-12 border-t-2 border-gray-800 p-2">
          <div className="col-span-3 flex items-center justify-center gap-4 px-[1.75rem]">
            <Picture className="group/image relative" identifier={image?.url}>
              <img
                alt={`track picture of ${track?.name}`}
                src={image?.url}
                className="h-12 w-12 rounded border-gray-800 object-cover transition-all duration-75 group-hover/item:scale-105 group-hover/image:opacity-75"
              />
            </Picture>
            <div className="inline-block w-3/4">
              {track && (
                <>
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
                </>
              )}
            </div>
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
              <Slider
                className="w-full"
                disabled={!track}
                value={[range]}
                min={0}
                max={30}
                onValueChange={(e) => {
                  const [value] = e;
                  if (value === undefined) return;
                  setRange(value);
                  moving.current = true;
                  if (currentTime.current)
                    currentTime.current.innerText = secondIntl(
                      Math.floor(value) + 1,
                      "mm:ss"
                    );
                }}
                onValueCommit={(e) => {
                  const [value] = e;
                  if (value !== undefined) goto(value);
                  moving.current = false;
                }}
                preview
              />
              <div className="min-w-[2rem] text-xs" ref={trackTime}>
                 
              </div>
            </div>
          </div>
          <div className="col-span-3 flex items-center justify-center gap-2">
            <Volume
              className="w-40"
              onValueChange={(vol, prev) => speaker(vol, prev)}
              onClick={(state) => (state ? unmute() : mute())}
            />
          </div>
        </div>
      </div>
    </TrackPlayerContext.Provider>
  );
};
