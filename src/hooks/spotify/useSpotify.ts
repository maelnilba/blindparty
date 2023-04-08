import { useStatePromise } from "@hooks/itsfine/useStateAsync";
import { useQuery } from "@tanstack/react-query";
import { api } from "@utils/api";
import { useEffect } from "react";
import SpotifyWebApi from "spotify-web-api-js";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const spotifyApi = new SpotifyWebApi();

const useSpotifyStore = create(
  persist<{
    accessToken: string;
    setAccessToken: (accessToken: string) => void;
  }>(
    (set) => ({
      accessToken: "",
      setAccessToken: (accessToken) => {
        spotifyApi.setAccessToken(accessToken);
        return set({ accessToken: accessToken });
      },
    }),
    {
      name: "spotify",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export function useSpotify() {
  const accessToken = useSpotifyStore((state) => state.accessToken);
  const setAccessToken = useSpotifyStore((state) => state.setAccessToken);

  const { data, isSuccess, isStale, refetch } = api.spotify.token.useQuery(
    undefined,
    {
      onSuccess: ({ accessToken }) => {
        setAccessToken(accessToken);
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    }
  );

  const { mutateAsync: renew } = api.spotify.renew.useMutation({
    onSuccess: ({ accessToken }) => {
      setAccessToken(accessToken);
    },
  });

  useEffect(() => {
    if (!accessToken) refetch();
  }, [accessToken]);

  return {
    success: Boolean(data && (isStale || isSuccess) && accessToken),
    renew: renew,
  };
}

const useGetUserPlaylists = () => {
  const { success, renew } = useSpotify();
  const { refetch, ...query } = useQuery(
    ["spotify", "user-playlist"],
    async () => {
      return (await spotifyApi.getUserPlaylists()).items;
    },
    {
      enabled: success,
      retry: false,
      onError: async () => {
        await renew();
        refetch();
      },
    }
  );

  return { refetch, ...query };
};

const useGetPlaylistTracks = () => {
  const { success, renew } = useSpotify();
  const [id, setId] = useStatePromise<string | null>(null);
  const { refetch, ...query } = useQuery(
    ["spotify", "playlist-tracks", id],
    async () => {
      return (await spotifyApi.getPlaylistTracks(id!)).items.filter(
        ({ track }) => Boolean(track?.preview_url)
      );
    },
    {
      enabled: Boolean(success && id),
      retry: false,
      onError: async () => {
        await renew();
        refetch();
      },
    }
  );

  return {
    ...query,
    refetch: ({ id }: { id: string }) => {
      setId(id).then(() => refetch());
    },
  };
};

const useSearchPlaylists = () => {
  const { success, renew } = useSpotify();
  const [field, setField] = useStatePromise<string | null>(null);
  const { refetch, ...query } = useQuery(
    ["spotify", "search-playlist", field],
    async () => {
      return (await spotifyApi.searchPlaylists(field!)).playlists.items;
    },
    {
      enabled: Boolean(success && field),
      retry: false,
      onError: async () => {
        await renew();
        refetch();
      },
    }
  );

  return {
    ...query,
    refetch: ({ field }: { field: string }) => {
      setField(field).then(() => refetch());
    },
  };
};

export const spotify = {
  getUserPlaylists: useGetUserPlaylists,
  getPlaylistTracks: useGetPlaylistTracks,
  searchPlaylists: useSearchPlaylists,
} as const;
