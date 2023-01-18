import { useState } from "react";

type MapObject = {
  [key: string]: any;
  id: string | number;
};

export function useMap<T extends MapObject>() {
  const [map, setMap] = useState<Map<MapObject["id"], T>>(new Map());

  const adds = (tracks: T[]) => {
    setMap((m) => {
      tracks.forEach((track) => {
        m.set(track.id, track);
      });
      return new Map(m);
    });
  };

  const removes = (tracks: T[]) => {
    setMap((m) => {
      tracks.forEach((track) => {
        m.delete(track.id);
      });
      return new Map(m);
    });
  };

  function add(track: T) {
    setMap((m) => new Map(m.set(track.id, track)));
  }

  const remove = (track: T) => {
    setMap((m) => {
      m.delete(track.id);
      return new Map(m);
    });
  };

  return {
    map,
    add,
    remove,
    adds,
    removes,
  };
}
