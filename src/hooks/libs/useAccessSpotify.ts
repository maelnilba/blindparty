import { api } from "@utils/api";

export function useAccessSpotify() {
  const {
    data: providers,
    isLoading,
    isError,
  } = api.user.provider.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const hasSpotify = providers?.includes("spotify");

  return [hasSpotify, isLoading, isError];
}
