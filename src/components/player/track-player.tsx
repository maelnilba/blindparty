import { PauseIcon } from "@components/icons/pause";
import { PlayIcon } from "@components/icons/play";
import { SpeakerIcon } from "@components/icons/speaker";
import { Picture } from "@components/images/picture";
import { Track } from "@components/playlist/types";
import { secondIntl } from "helpers/date";
import { percent } from "helpers/math";
import { asyncnoop, noop } from "helpers/noop";
import {
  ComponentProps,
  createContext,
  useContext,
  useRef,
  useState,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Player, useIsPlaying } from "./audio-player";
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

  const image = currentTrack?.album?.images?.at(0);

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
            <Picture
              className="group/image relative shrink-0"
              identifier={image?.url}
            >
              <img
                alt={`track picture of ${currentTrack?.name}`}
                src={image?.url}
                className="h-12 w-12 rounded border-gray-800 object-cover transition-all duration-75 group-hover/item:scale-105"
              />
            </Picture>
            <div className="inline-block w-3/4">
              {currentTrack && (
                <>
                  <span
                    title={currentTrack.name}
                    className="block overflow-hidden truncate text-ellipsis font-extrabold"
                  >
                    {currentTrack.name}
                  </span>
                  <span
                    title={currentTrack.artists.map((a) => a.name).join(", ")}
                    className="block overflow-hidden truncate text-ellipsis"
                  >
                    {currentTrack.artists.map((a) => a.name).join(", ")}
                  </span>
                </>
              )}
            </div>
          </div>
          <Player.Root
            defaultVolume={defaultVolume}
            defaultMuted={defaultMuted}
            ref={audio}
            className="invisible h-0 opacity-0"
          >
            <div className="col-span-6 flex flex-col items-center justify-center gap-2">
              <Player.Play className="block cursor-pointer rounded-full bg-white p-2.5 transition-transform duration-75 hover:scale-105 data-[play=true]:hidden">
                <PlayIcon className="h-6 w-6 text-black" />
              </Player.Play>
              <Player.Pause className="hidden cursor-pointer rounded-full bg-white p-2.5 transition-transform duration-75 hover:scale-105 data-[play=true]:block">
                <PauseIcon className="h-6 w-6 text-black" />
              </Player.Pause>
              <Player.Time>
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
              </Player.Time>
            </div>
            <div className="col-span-3 flex items-center justify-center">
              <Player.Volume>
                {({ volume, setVolume, muted, setMuted }) => (
                  <div className="flex w-40 items-center gap-2">
                    <SpeakerIcon
                      percent={muted ? 0 : percent(volume, [0, 100])}
                      className="h-6 w-6 cursor-pointer transition-all hover:scale-105"
                      onClick={() => {
                        setMuted(!muted);
                        setDefaultMuted(!muted);
                      }}
                    />
                    <Volume
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
                )}
              </Player.Volume>
            </div>
          </Player.Root>
        </div>
      </div>
    </TrackPlayerContext.Provider>
  );
};
