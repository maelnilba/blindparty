import { useState } from "react";

export function useSet<T extends string | number>(
  initialValue: Set<T> = new Set()
) {
  const [set, setSet] = useState<Set<T>>(initialValue);

  const adds = (items: T[]) => {
    setSet((s) => {
      items.forEach((item) => {
        s.add(item);
      });
      return new Set(s);
    });
  };

  const removes = (items: T[]) => {
    setSet((s) => {
      items.forEach((item) => {
        s.delete(item);
      });
      return new Set(s);
    });
  };

  function add(item: T) {
    setSet((s) => new Set(s.add(item)));
  }

  const remove = (item: T) => {
    setSet((s) => {
      s.delete(item);
      return new Set(s);
    });
  };

  const toggle = (item: T) => {
    if (set.has(item)) {
      set.delete(item);
      setSet(new Set(set));
    } else setSet(new Set(set.add(item)));
  };

  const toggles = (items: T[]) => {
    items.forEach((item) => {
      if (set.has(item)) set.delete(item);
      else set.add(item);
    });

    setSet(new Set(set));
  };

  const reset = () => {
    setSet((s) => {
      return new Set();
    });
  };

  return {
    set,
    add,
    remove,
    adds,
    removes,
    toggle,
    toggles,
    reset,
  };
}
