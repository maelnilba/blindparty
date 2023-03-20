import { Picture } from "@components/images/picture";
import Navigation from "@components/navigation";
import { TrackPlayer, usePlayer } from "@components/spotify/track-player";
import { PlaylistTrackInfoCard } from "@components/spotify/playlist-track-card";
import { getServerAuthSession } from "@server/auth";
import { api } from "@utils/api";
import { getQuery } from "@utils/next-router";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPage,
} from "next";
import { useRouter } from "next/router";
import { Track } from "../#types";
import { prisma } from "@server/db";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const id = getQuery(context.query.id);
  if (!id)
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };

  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (!session || !session.user) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  const playlist = await prisma.playlist.findFirst({
    where: {
      AND: [
        {
          id: id,
        },
        {
          OR: [
            {
              user: {
                some: {
                  id: session.user.id,
                },
              },
              public: false,
            },
            {
              public: true,
            },
          ],
        },
      ],
    },
    include: {
      tracks: {
        include: {
          album: {
            include: {
              images: true,
            },
          },
          artists: true,
        },
      },
    },
  });

  return {
    props: {
      playlist,
    },
  };
}

const PlaylistDiscover = ({
  playlist,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const { query } = useRouter();

  const { load, start, pause, unpause, currentTrack, playing } = usePlayer();
  const playTrack = async (track: Track) => {
    if (currentTrack?.id === track.id && playing) {
      pause();
    } else if (currentTrack?.id === track.id) {
      unpause();
    } else {
      await load(track);
      await start();
    }
  };

  return (
    <div className="flex flex-row gap-2">
      <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto pb-20">
        <div className="sticky top-0 z-10 flex flex-col gap-2 bg-black/10 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4 px-6">
            <Picture identifier={playlist?.picture}>
              <img
                src={playlist?.picture!}
                className="aspect-square h-24 w-24 object-cover"
              />
            </Picture>
            <div className="flex flex-[2] flex-col gap-2">
              <label className="font-semibold">{playlist?.name}</label>
            </div>
          </div>
        </div>
        <div className="p-4">
          {playlist?.tracks.map((track) => (
            <PlaylistTrackInfoCard
              key={track.id}
              track={track}
              onPlay={playTrack}
              playing={
                Boolean(currentTrack) &&
                currentTrack?.id === track.id &&
                playing
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const PlaylistDiscoverWrapper: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ playlist }) => {
  return (
    <div className="relative min-h-screen w-screen">
      <Navigation />
      <TrackPlayer>
        <PlaylistDiscover playlist={playlist} />
      </TrackPlayer>
    </div>
  );
};

export default PlaylistDiscoverWrapper;
