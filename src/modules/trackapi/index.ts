import SpotifyWebApi from "spotify-web-api-js";
import { DeezerWebApi } from "./deezer";

const apis = ["deezer", "spotify"] as const;
type Api = (typeof apis)[number];

export class TrackApi {
  private webApi: SpotifyWebApi.SpotifyWebApiJs | DeezerWebApi | null = null;
  private apiType?: Api;

  constructor(apiType?: Api) {
    if (apiType === "deezer") this.webApi = new DeezerWebApi();
    if (apiType === "spotify") this.webApi = new SpotifyWebApi();
    this.apiType = apiType;
  }

  get type(): Api | undefined {
    return this.apiType;
  }

  /**
   * Sets the web api to be used.
   */
  setApi(apiType: Api | null) {
    if (apiType === "deezer") this.webApi = new DeezerWebApi();
    if (apiType === "spotify") this.webApi = new SpotifyWebApi();
    if (apiType === null) this.webApi = null;
    this.apiType = apiType ?? undefined;
  }

  /**
   * Gets the web api in use.
   */
  getApi(): SpotifyWebApi.SpotifyWebApiJs | DeezerWebApi | null {
    return this.webApi;
  }

  /**
   * Sets the access token to be used.
   */
  setAccessToken(accessToken: string | null): void {
    if (this.webApi === null) throw new Error("No WebApi set");
    this.webApi.setAccessToken(accessToken);
  }

  /**
   * Gets the access token in use.
   */
  getAccessToken(): string | null {
    if (this.webApi === null) throw new Error("No WebApi set");
    return this.webApi.getAccessToken();
  }

  /**
   * Fetches information about the current user.
   */
  async getMe() {
    if (this.webApi === null) throw new Error("No WebApi set");
    return this.webApi.getMe().then(Converter.user);
  }

  /**
   * Fetches information about the user.
   */
  async getUser(userId: string) {
    if (this.webApi === null) throw new Error("No WebApi set");
    return this.webApi.getUser(userId).then(Converter.user);
  }

  /**
   * Fetches a list of the user's playlists.
   */
  async getUserPlaylists(userId?: string) {
    if (this.webApi === null) throw new Error("No WebApi set");
    return this.webApi.getUserPlaylists(userId).then(Converter.userPlaylists);
  }

  /**
   * Fetches a specific playlist.
   */
  async getPlaylist(playlistId: string) {
    if (this.webApi === null) throw new Error("No WebApi set");
    return this.webApi.getPlaylist(playlistId).then(Converter.playlist);
  }

  /**
   * Fetches the tracks from a specific playlist.
   */
  async getPlaylistTracks(playlistId: string) {
    if (this.webApi === null) throw new Error("No WebApi set");

    return this.getAllPlaylistTrackss(playlistId, {
      limit: this.limit,
      offset: 0,
    });
  }

  private get limit(): number {
    return this.type === "deezer" ? 500 : this.type === "spotify" ? 50 : 50;
  }

  private async getAllPlaylistTrackss(
    playlistId: string,
    options: DeezerApi.ListOptions
  ): Promise<TrackApi.Track[]> {
    if (this.webApi === null) throw new Error("No WebApi set");

    const data = await this.webApi!.getPlaylistTracks(playlistId, options).then(
      Converter.playlistTracks
    );

    if (data.total <= data.items.length) return data.items;

    return Promise.all(
      Array.from(
        { length: Math.ceil(data.total / this.limit) },
        (v, i) => i * this.limit
      )
        .slice(1)
        .map((offset) =>
          this.webApi
            ?.getPlaylistTracks(playlistId, {
              offset,
              limit: this.limit,
            })
            .then(Converter.playlistTracks)
        )
    ).then((promises) =>
      promises
        .filter((data) => Boolean(data))
        .map((data) => data!.items)
        .concat(data.items)
        .flat()
        .sort((a, b) => a.added_at - b.added_at)
    );
  }

  /**
   * Fetches playlists from the Spotify catalog according to a query.
   */
  async searchPlaylists(query: string) {
    if (this.webApi === null) throw new Error("No WebApi set");
    return this.webApi.searchPlaylists(query).then(Converter.playlistsSearch);
  }
}

class Converter {
  constructor() {}

  static user(
    user: SpotifyApi.UserProfileResponse | DeezerApi.User | DeezerApi.Me
  ): TrackApi.User {
    return {
      id: String(user.id),
      name: "name" in user ? user.name : user.display_name,
      images:
        "picture" in user
          ? [
              user.picture,
              user.picture_small,
              user.picture_medium,
              user.picture_big,
              user.picture_xl,
            ].map((image) => ({ url: image }))
          : (user.images ?? []).map((image) => ({ url: image.url })),
    };
  }

  static userPlaylists(
    userPlaylists:
      | SpotifyApi.ListOfUsersPlaylistsResponse
      | DeezerApi.List<DeezerApi.Playlist>
  ): TrackApi.Paginated<TrackApi.Playlist> {
    return {
      total: userPlaylists.total,
      items:
        "items" in userPlaylists
          ? userPlaylists.items.map((item) => ({
              id: String(item.id),
              description: item.description,
              name: item.name,
              images: item.images.map((image) => ({ url: image.url })),
            }))
          : userPlaylists.data.map((item) => ({
              id: String(item.id),
              description: null,
              name: item.title,
              images: [
                item.picture,
                item.picture_small,
                item.picture_medium,
                item.picture_big,
                item.picture_xl,
              ].map((image) => ({ url: image })),
            })),
    };
  }

  static playlist(
    playlist: SpotifyApi.SinglePlaylistResponse | DeezerApi.PlaylistFull
  ): TrackApi.Playlist {
    return {
      id: String(playlist.id),
      description: playlist.description,
      name: "name" in playlist ? playlist.name : playlist.title,
      images:
        "images" in playlist
          ? playlist.images.map((image) => ({ url: image.url }))
          : [
              playlist.picture_big,
              playlist.picture_xl,
              playlist.picture_medium,
              playlist.picture_small,
              playlist.picture,
            ].map((image) => ({ url: image })),
    };
  }

  static playlistTracks(
    playlistTracks:
      | SpotifyApi.PlaylistTrackResponse
      | DeezerApi.List<DeezerApi.Track>
  ): TrackApi.Paginated<TrackApi.Track> {
    return {
      total: playlistTracks.total,
      items:
        "items" in playlistTracks
          ? playlistTracks.items
              .map((t) => ({ track: t.track, added_at: t.added_at }))
              .filter((t) => Boolean(t.track))
              .map(({ track: item, added_at }) => ({
                id: item!.id,
                name: item!.name,
                preview_url: item!.preview_url,
                album: {
                  name: item!.album.name,
                  images: item!.album.images.map((image) => ({
                    url: image.url,
                  })),
                },
                artists: item!.artists.map((artist) => ({ name: artist.name })),
                added_at: Date.parse(added_at) / 1000,
              }))
          : playlistTracks.data.map((item) => ({
              id: String(item.id),
              name: item.title,
              preview_url: item.preview,
              album: {
                name: item.album.title,
                images: [
                  item.album.cover_big,
                  item.album.cover_xl,
                  item.album.cover_medium,
                  item.album.cover_small,
                  item.album.cover,
                ].map((image) => ({ url: image })),
              },
              artists: [{ name: item.artist.name }],
              added_at: item.time_add,
            })),
    };
  }

  static playlistsSearch(
    playlistsSearch:
      | SpotifyApi.PlaylistSearchResponse
      | DeezerApi.List<DeezerApi.PlaylistSearch>
  ): { playlists: TrackApi.Paginated<TrackApi.Playlist> } {
    return {
      playlists:
        "playlists" in playlistsSearch
          ? Converter.userPlaylists(playlistsSearch.playlists)
          : // @ts-expect-error
            Converter.userPlaylists(playlistsSearch),
    };
  }
}
