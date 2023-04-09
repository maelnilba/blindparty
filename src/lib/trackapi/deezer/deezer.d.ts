declare namespace DeezerApi {
  type Me = {
    id: number;
    name: string;
    lastname: string;
    firstname: string;
    email: string;
    status: number;
    birthday: string;
    inscription_date: string;
    gender: "F" | "M" | "";
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
    country: string;
    lang: string;
    is_kid: boolean;
    explicit_content_level: string;
    explicit_content_levels_available: (
      | "explicit_display"
      | "explicit_no_recommendation"
      | "explicit_hide"
    )[];
    tracklist: string;
  };

  type User = {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
    country: string;
    tracklist: string;
    type: "user" | unknown;
  };

  type ListOptions = {
    index?: number;
    limit?: number;
  };

  type List<T = unknown> = {
    data: T[];
    total: number;
  };

  type Playlist = {
    id: number;
    title: string;
    duration: number;
    public: boolean;
    is_loved_track: boolean;
    collaborative: boolean;
    nb_tracks: number;
    fans: number;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
    checksum: string;
    /**
     * Unix timestamp
     */
    time_add: number; //
    /**
     * Unix timestamp
     */
    time_mod: number;
    creator: {
      id: number;
      name: string;
    };
  };

  type PlaylistFull = Playlist & {
    description: string;
    unseen_track_count: number;
    share: string;
    tracks: Track[];
  };

  type PlaylistSearch = Omit<
    Playlist,
    "creator" | "time_add" | "time_mod" | "duration" | "fans"
  > & {
    tracklist: string;
    creation_date: "2017-10-02 10:07:26";
    md5_image: "8e917792796412110f79996f4ae53b09";
    picture_type: "playlist" | "cover" | unknown;
    user: {
      id: number;
      name: string;
      tracklist: string;
      type: "user" | unknown;
    };
    type: "playlist" | unknown;
  };

  type Track = {
    id: number;
    readable: boolean;
    title: string;
    title_short: string;
    title_version: string | null;
    unseen: boolean;
    link: string;
    duration: number;
    rank: number;
    explicit_lyrics: boolean;
    preview: string;
    time_add: string;
    artist: Artist;
    album: Album;
  };

  type Artist = {
    id: number;
    name: string;
    link: string;
  };

  type Album = {
    id: number;
    title: string;
    cover: string;
    cover_small: string;
    cover_medium: string;
    cover_big: string;
    cover_xl: string;
  };
}
