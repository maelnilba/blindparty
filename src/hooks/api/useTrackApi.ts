import { useStateAsync } from "@hooks/itsfine/useStateAsync";
import { TrackApi } from "modules/trackapi";
import type { Provider } from "@server/api/routers/user/tokens";
import { useQuery } from "@tanstack/react-query";
import { api } from "@utils/api";
import { useEffect, useRef } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const trackApi = new TrackApi();

const useTrackApiStore = create(
  persist<{
    accessToken: string;
    provider: Provider | null;
    setAccessToken: (accessToken: string, provider?: Provider) => void;
  }>(
    (set, get) => ({
      accessToken: "",
      provider: null,
      setAccessToken: (accessToken, provider) => {
        if (!trackApi.getApi()) {
          if (get().provider) trackApi.setApi(get().provider);
        }

        if (provider && trackApi.type !== provider) {
          trackApi.setApi(provider);
        }

        trackApi.setAccessToken(accessToken);
        return set({ accessToken: accessToken, provider: provider });
      },
    }),
    {
      name: "track-api",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export function useTrackApi() {
  const accessToken = useTrackApiStore((state) => state.accessToken);
  const setAccessToken = useTrackApiStore((state) => state.setAccessToken);

  const { data, isSuccess, isStale, refetch } = api.user.tokens.token.useQuery(
    undefined,
    {
      onSuccess: ({ accessToken, provider }) => {
        setAccessToken(accessToken, provider);
      },
      refetchOnWindowFocus: false,
    }
  );

  const { mutateAsync: renew } = api.user.tokens.renew.useMutation({
    onSuccess: ({ accessToken, provider }) => {
      setAccessToken(accessToken, provider);
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
  const { success, renew } = useTrackApi();
  const { refetch, ...query } = useQuery(
    ["track-api", "user-playlist"],
    async () => {
      return (await trackApi.getUserPlaylists()).items;
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
  const { success, renew } = useTrackApi();
  const [id, setId] = useStateAsync<string | null>(null);
  const { refetch, ...query } = useQuery(
    ["track-api", "playlist-tracks", id],
    async () => {
      return (await trackApi.getPlaylistTracks(id!)).filter((track) =>
        Boolean(track?.preview_url)
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
    refetch: async ({ id }: { id: string }) => {
      await setId(id);
      refetch();
    },
  };
};

const useSearchPlaylists = () => {
  const { success, renew } = useTrackApi();
  const [field, setField] = useStateAsync<string | null>(null);
  const { refetch, ...query } = useQuery(
    ["track-api", "search-playlist", field],
    async () => {
      return (await trackApi.searchPlaylists(field!)).playlists.items;
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
    refetch: async ({ field }: { field: string }) => {
      await setField(field);
      refetch();
    },
  };
};

export const spotify = {
  getUserPlaylists: useGetUserPlaylists,
  getPlaylistTracks: useGetPlaylistTracks,
  searchPlaylists: useSearchPlaylists,
} as const;
