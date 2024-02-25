import { PauseIcon } from "@components/icons/pause";
import { PlayIcon } from "@components/icons/play";
import { Picture } from "@components/images/picture";
import { Track } from "@components/playlist/types";
import { secondIntl } from "helpers/date";
import { asyncnoop, noop } from "helpers/noop";
import {
  ComponentProps,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { AudioPlayer, useIsPlaying } from "./audio-player";
import { Timer } from "./music-timer";
import { Volume, usePlayerVolumeStore } from "./volume";

type TrackPlayerContext = {
  currentTrack: Track | null;
  playing: boolean;
  load: (track: Track) => void;
  play: () => Promise<void>;
  unload: () => void;
  pause: () => void;
  unpause: () => Promise<void>;
  toggle: () => Promise<void>;
  mute: () => void;
  unmute: () => void;
};

const TrackPlayerContext = createContext<TrackPlayerContext>({
  currentTrack: null,
  playing: false,
  load: (track) => {},
  unload: noop,
  play: asyncnoop,
  pause: noop,
  unpause: asyncnoop,
  toggle: asyncnoop,
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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  const { defaultVolume, setDefaultVolume, defaultMuted, setDefaultMuted } =
    usePlayerVolumeStore((state) => ({
      defaultVolume: state.volume / 100,
      setDefaultVolume: (volume: number) => state.setVolume(volume * 100),
      setDefaultMuted: (muted: boolean) => state.setMuted(muted),
      defaultMuted: state.muted,
    }));

  const playing = useIsPlaying(audio);

  const load = (track: Track) => {
    if (audio.current && track.previewUrl) {
      setCurrentTrack(track);
      audio.current.currentTime = 0;
      audio.current.src = track.previewUrl;
      audio.current.load();
    }
  };

  const unload = () => {
    if (audio.current) {
      setCurrentTrack(null);
      audio.current.src = "";
      audio.current.load();
    }
  };

  const play = async () => {
    if (audio.current) return audio.current.play();
  };

  const pause = () => {
    if (audio.current) audio.current.pause();
  };

  const unpause = async () => {
    if (audio.current) return audio.current.play();
  };

  const toggle = async () => {
    if (audio.current)
      return audio.current.paused
        ? audio.current.play()
        : audio.current.pause();
  };

  const mute = () => {
    if (audio.current) audio.current.muted = true;
  };

  const unmute = () => {
    if (audio.current) audio.current.muted = false;
  };

  const goto = (time: number) => {
    if (audio.current) audio.current.currentTime = time;
  };

  useHotkeys("space", () => toggle(), [], {
    enableOnFormTags: false,
    preventDefault: true,
  });

  return (
    <TrackPlayerContext.Provider
      value={{
        currentTrack,
        playing,
        load,
        unload,
        play,
        pause,
        unpause,
        toggle,
        mute,
        unmute,
      }}
    >
      {children}
      <div
        {...props}
        className="fixed bottom-0 z-50 bg-white/5 backdrop-blur-sm"
        style={{ width: "100%" }}
      >
        <div className="grid w-full grid-cols-12 border-t-2 border-gray-800 p-2">
          <div className="col-span-3 flex items-center justify-center gap-4 px-[1.75rem]">
            <TrackInfo track={currentTrack} />
          </div>
          <AudioPlayer.Root
            defaultVolume={defaultVolume}
            defaultMuted={defaultMuted}
            ref={audio}
            className="invisible h-0 opacity-0"
          >
            <div className="col-span-6 flex flex-col items-center justify-center gap-2">
              <AudioPlayer.Play className="block cursor-pointer rounded-full bg-white p-2.5 transition-transform duration-75 hover:scale-105 data-[play=true]:hidden">
                <PlayIcon className="h-6 w-6 text-black" />
              </AudioPlayer.Play>
              <AudioPlayer.Pause className="hidden cursor-pointer rounded-full bg-white p-2.5 transition-transform duration-75 hover:scale-105 data-[play=true]:block">
                <PauseIcon className="h-6 w-6 text-black" />
              </AudioPlayer.Pause>
              <AudioPlayer.Time>
                {({ time, duration }) => {
                  return (
                    <div className="flex h-4 w-full items-center justify-center gap-2">
                      <span className="min-w-[2rem] text-xs">
                        {duration > 0 &&
                          secondIntl(Math.floor(time) + 1, "mm:ss")}
                      </span>
                      <Timer
                        onValueCommit={([value]) => {
                          if (!(value === undefined || duration < 1))
                            goto(value);
                        }}
                        className="w-full"
                        min={0}
                        max={duration || 30}
                        value={[time]}
                      />
                      <span className="min-w-[2rem] text-xs">
                        {duration > 0 &&
                          secondIntl(Math.floor(duration) + 1, "mm:ss")}
                      </span>
                    </div>
                  );
                }}
              </AudioPlayer.Time>
            </div>
            <div className="col-span-3 flex items-center justify-center">
              <AudioPlayer.Volume>
                {({ volume, setVolume, muted, setMuted }) => (
                  <Volume
                    className="flex w-40 items-center gap-2"
                    volume={volume}
                    muted={muted}
                    setVolume={setVolume}
                    setMuted={setMuted}
                    defaultVolume={defaultVolume}
                    setDefaultVolume={setDefaultVolume}
                    setDefaultMuted={setDefaultMuted}
                  />
                )}
              </AudioPlayer.Volume>
            </div>
          </AudioPlayer.Root>
        </div>
      </div>
    </TrackPlayerContext.Provider>
  );
};

type TrackInfoProps = {
  track: Track | null;
};

const TrackInfo = ({ track }: TrackInfoProps) => {
  const image = track?.album?.images?.at(0);
  return (
    <>
      <Picture
        className="group/image relative shrink-0"
        identifier={image?.url}
      >
        <img
          alt={`track picture of ${track?.name}`}
          src={image?.url}
          className="h-12 w-12 rounded border-gray-800 object-cover transition-all duration-75 group-hover/item:scale-105"
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
    </>
  );
};
