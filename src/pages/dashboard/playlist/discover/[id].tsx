import { ClockIcon } from "@components/icons/clock";
import { Picture } from "@components/images/picture";
import { GetLayoutThrough } from "@components/layout/layout";
import { PlaylistTrackInfoCard } from "@components/spotify/playlist-track-card";
import { TrackPlayer, usePlayer } from "@components/spotify/track-player";
import { useRelativeTime } from "@hooks/useRelativeTime";
import { getServerAuthSession } from "@server/auth";
import { prisma } from "@server/db";
import { getQuery } from "@utils/next-router";
import type {
  GetServerSidePropsContext,
  InferGetServerSidePropsType,
  NextPageWithLayout,
} from "next";
import { Track } from "../#types";

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
      _count: {
        select: {
          user: true,
          Party: true,
        },
      },
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

  if (!playlist)
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };

  return {
    props: {
      playlist,
    },
  };
}

const PlaylistDiscover = ({
  playlist,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const relativeUpdate = useRelativeTime(playlist.updatedAt);
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
      <div className="scrollbar-hide relative flex h-[40rem] flex-1 flex-col gap-2 overflow-y-auto pt-20">
        <div className="sticky top-0 z-10 flex flex-col items-start justify-center gap-2 bg-black/10 py-2 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-4 px-6">
            <Picture identifier={playlist?.picture}>
              <img
                src={playlist?.picture!}
                className="aspect-square h-24 w-24 object-cover"
              />
            </Picture>
            <div className="flex flex-col gap-2">
              <p className="text-4xl font-extrabold">{playlist.name}</p>
              <div className="flex flex-col gap-1">
                <div className="flex flex-row gap-2">
                  <ClockIcon className="h-4 w-4" />
                  <p className="text-xs font-normal">{relativeUpdate}</p>
                </div>
                <p className="text-xs font-normal">
                  Ajoutée par {playlist._count.user} utilisateurs
                </p>
                <p className="text-xs font-normal">
                  Jouée {playlist._count.Party} fois
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          {playlist.tracks.map((track) => (
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

const PlaylistDiscoverWrapper: NextPageWithLayout<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ playlist }) => {
  return (
    <TrackPlayer>
      <PlaylistDiscover playlist={playlist} />
    </TrackPlayer>
  );
};

export default PlaylistDiscoverWrapper;

PlaylistDiscoverWrapper.getLayout = GetLayoutThrough;
