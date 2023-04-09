import fetchJsonp from "./fetch";

export class DeezerWebApi {
  private apiUrl = "https://api.deezer.com/" as const;
  private accessToken: string | null = null;
  constructor() {}

  /**
   * Sets the access token to be used.
   * See [the Authorization Guide](https://developers.deezer.com/api/oauth) on
   * the Deezer Developer site for more information about obtaining an access token.
   *
   * @param {string} accessToken The access token
   * @return {void}
   */
  setAccessToken(accessToken: string | null): void {
    this.accessToken = accessToken;
  }

  /**
   * Gets the access token in use.
   *
   * @return {string} accessToken The access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Fetches information about the current user.
   * See [Get Current User's Profile](https://developers.deezer.com/api/user#infos) on
   * the Deezer Developer site for more information about the endpoint.
   */
  async getMe(): Promise<DeezerApi.Me> {
    return this.fetchApi<DeezerApi.Me>(["user", "me"]);
  }

  /**
   * Fetches information about the user.
   * See [Get Current User's Profile](https://developers.deezer.com/api/user#infos) on
   * the Deezer Developer site for more information about the endpoint.
   */
  async getUser(userId: string): Promise<DeezerApi.User> {
    return this.fetchApi<DeezerApi.User>(["user", userId]);
  }

  /**
   * Fetches a list of the user's playlists.
   * See [Get a List of a User's Playlists](https://developers.deezer.com/api/user/playlists) on
   * the Deezer Developer site for more information about the endpoint.
   */
  async getUserPlaylists(
    userId?: string,
    options?: DeezerApi.ListOptions
  ): Promise<DeezerApi.List<DeezerApi.Playlist>> {
    if (userId)
      return this.fetchApi<DeezerApi.List<DeezerApi.Playlist>>(
        ["user", userId, "playlists"],
        options
      );

    return this.fetchApi<DeezerApi.List<DeezerApi.Playlist>>(
      ["user", "me", "playlists"],
      options
    );
  }

  /**
   * Fetches a specific playlist.
   * See [Get a Playlist](https://developers.deezer.com/api/playlist) on
   * the Deezer Developer site for more information about the endpoint.
   */
  async getPlaylist(
    playlistId: string,
    options?: DeezerApi.ListOptions
  ): Promise<DeezerApi.PlaylistFull> {
    return this.fetchApi<DeezerApi.PlaylistFull>(
      ["playlist", playlistId],
      options
    );
  }

  /**
   * Fetches the tracks from a specific playlist.
   * See [Get a Playlist's Tracks](https://developers.deezer.com/api/playlist/tracks) on
   * the Deezer Developer site for more information about the endpoint.
   */
  async getPlaylistTracks(
    playlistId: string,
    options?: DeezerApi.ListOptions
  ): Promise<DeezerApi.List<DeezerApi.Track>> {
    return this.fetchApi<DeezerApi.List<DeezerApi.Track>>(
      ["playlist", playlistId, "tracks"],
      options
    );
  }

  /**
   * Fetches playlists from the Spotify catalog according to a query.
   */
  async searchPlaylists(
    query: string,
    options?: DeezerApi.ListOptions
  ): Promise<DeezerApi.List<DeezerApi.PlaylistSearch>> {
    return this.fetchApi<DeezerApi.List<DeezerApi.PlaylistSearch>>(
      ["search", "playlist"],
      options,
      { q: query }
    );
  }

  private async fetchApi<TResponse = unknown>(
    endpoints: string[],
    options?: DeezerApi.ListOptions,
    params?: { [param: string]: string },
    method: "GET" | "POST" | "DELETE" | "PUT" = "GET"
  ): Promise<TResponse> {
    const url = new URL(endpoints.join("/"), this.apiUrl);

    if (this.accessToken)
      url.searchParams.append("access_token", this.accessToken);

    if (options) {
      Object.entries(options).forEach(([k, v]) =>
        url.searchParams.append(k, String(v))
      );
    }

    if (params) {
      Object.entries(params).forEach(([k, v]) =>
        url.searchParams.append(k, String(v))
      );
    }

    if (method) {
      url.searchParams.append("request_method", method);
    }

    url.searchParams.append("output", "jsonp");

    return fetchJsonp(url.toString()).then(function (response) {
      return response.json();
    }) as Promise<TResponse>;
  }
}
