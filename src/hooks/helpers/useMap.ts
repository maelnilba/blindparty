import { useState } from "react";

type MapObject = {
  [key: string]: any;
  id: string | number;
};

export function useMap<T extends MapObject>(
  initialValue: Map<T["id"], T> = new Map()
) {
  const [map, setMap] = useState<Map<T["id"], T>>(initialValue);

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

  const toggle = (item: T) => {
    if (map.has(item.id)) {
      map.delete(item.id);
      setMap(new Map(map));
    } else setMap(new Map(map.set(item.id, item)));
  };

  const toggles = (items: T[]) => {
    items.forEach((item) => {
      if (map.has(item.id)) map.delete(item.id);
      else map.set(item.id, item);
    });

    setMap(new Map(map));
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
    toggle,
    toggles,
    reset,
  };
}
