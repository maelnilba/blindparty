declare module TrackApi {
  type Paginated<T = unknown> = {
    total: number;
    items: T[];
  };

  type Image = {
    url: string;
  };

  type User = {
    id: string;
    name?: string;
    images?: Image[];
  };

  type Track = {
    album: {
      name: string;
      images: Image[];
    };
    artists: {
      name: string;
    }[];
    id: string;
    name: string;
    preview_url: string | null;
    /**
     * Unix timestamp
     */
    added_at: number;
  };

  type Playlist = {
    id: string;
    name: string;
    description: string | null;
    images: Image[];
  };
}
