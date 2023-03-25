import { createQueryValidator } from "@lib/helpers/query-validator";
import { z } from "zod";
import { create } from "zustand";

const validator = createQueryValidator(
  z.object({
    sources: z.array(z.string().url()).length(4),
  })
);

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
      className={`${
        className ?? ""
      } group relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded object-cover text-white outline outline-1 outline-gray-800`}
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
