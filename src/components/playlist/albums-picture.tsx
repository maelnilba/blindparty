import { validator } from "@shared/validators/merge";
import { twMerge } from "tailwind-merge";
import { create } from "zustand";

export const useAlbumsPictureStore = create<{
  cache: Map<string, Blob>;
  fetch: (sources: string[]) => Promise<Blob>;
}>((set, get) => ({
  cache: new Map(),
  fetch: async (sources) => {
    const hash = sources.join("|");
    const _cache = get().cache;
    if (_cache.has(hash)) return _cache.get(hash)!;

    const url = validator.createSearchURL({
      sources: sources,
    });
    const res = await fetch(`/api/og/merge${url}`);
    const img = await res.blob();
    set({ cache: new Map(_cache.set(hash, img)) });
    return img;
  },
}));

export const AlbumsPicture = ({
  row1,
  row2,
  className,
}: {
  row1: string[];
  row2: string[];
  className?: string;
}) => {
  // flex-col issues
  const [A1, A2] = row1;
  const [B1, B2] = row2;
  return (
    <div
      className={twMerge(
        "group relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded object-cover text-white outline outline-1 outline-gray-800",
        className
      )}
    >
      <picture>
        <img className="aspect-square" src={A1} />
        <img className="aspect-square" src={B1} />
      </picture>
      <picture>
        <img className="aspect-square" src={A2} />
        <img className="aspect-square" src={B2} />
      </picture>
    </div>
  );
};

import { Track } from "@components/playlist/types";
import { useDebounce } from "@hooks/helpers/useDebounce";
import { useAsyncEffect } from "@hooks/itsfine/useAsyncEffect";
import { useState } from "react";

export function useMergeAlbum<T extends Map<Track["id"], Track>>(map: T) {
  const [mockAlbumsPicture, setMockAlbumsPicture] = useState<
    string[] | undefined
  >();
  const fetchMergeAlbum = useAlbumsPictureStore((state) => state.fetch);
  const setMockAlbumsPictureDebounce = useDebounce(
    async (sources: string[]) => {
      setMockAlbumsPicture(sources);
    },
    100
  );

  useAsyncEffect(async () => {
    if (map.size > 3) {
      const images = [
        ...[...map]
          .map(([_, v]) => v.album.images)
          .reduce((map, images) => {
            const image = images[0];
            if (image) map.set(image.url, (map.get(image.url) ?? 0) + 1);
            return map;
          }, new Map<string, number>()),
      ]
        .map(([k, v]) => ({
          count: v,
          image: k,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      if (images.length !== 4) return;
      const sources = images.map((img) => img.image).sort();
      await setMockAlbumsPictureDebounce(sources);
    }

    if (map.size < 4) {
      setMockAlbumsPicture(undefined);
    }
  }, [map]);

  return [mockAlbumsPicture, fetchMergeAlbum] as const;
}
