import { useState } from "react";

type MapObject = {
  [key: string]: any;
  id: string | number;
};

export function useMap<T extends MapObject>() {
  const [map, setMap] = useState<Map<MapObject["id"], T>>(new Map());

  const adds = (items: T[]) => {
    setMap((m) => {
      items.forEach((item) => {
        m.set(item.id, item);
      });
      return new Map(m);
    });
  };

  const removes = (items: T[]) => {
    setMap((m) => {
      items.forEach((item) => {
        m.delete(item.id);
      });
      return new Map(m);
    });
  };

  function add(item: T) {
    setMap((m) => new Map(m.set(item.id, item)));
  }

  const remove = (item: T) => {
    setMap((m) => {
      m.delete(item.id);
      return new Map(m);
    });
  };

  const reset = () => {
    setMap((m) => {
      return new Map();
    });
  };

  return {
    map,
    add,
    remove,
    adds,
    removes,
    reset,
  };
}
