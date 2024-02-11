type Subscriber<T> = {
  subscribe: <P extends keyof T>(prop: P, fn: (value: T[P]) => void) => void;
  unsubscribe: <P extends keyof T>(prop: P) => boolean;
};

type SubscriberOptions = {
  triggerOnEquals: boolean;
};

export type SubscriberProxy<T = {}> = Subscriber<T> & T;

const defaultOptions: SubscriberOptions = {
  triggerOnEquals: false,
};

export function useSubscriber<T>(
  ctx: T,
  options: SubscriberOptions = defaultOptions
) {
  const subscribers = new Map<string, Function>();
  return new Proxy<Subscriber<T> & T>(
    {
      ...ctx,
      subscribe: function <P extends keyof T>(
        prop: P,
        fn: (value: T[P]) => void
      ) {
        subscribers.set(String(prop), fn);
      },
      unsubscribe: function <P extends keyof T>(prop: P) {
        return subscribers.delete(String(prop));
      },
    },
    {
      set(
        target: T & Subscriber<T>,
        prop: keyof T extends string ? keyof T : never,
        value: any
      ) {
        if (!options?.triggerOnEquals && target[prop] === value) return true;

        target[prop] = value;

        const subscription = subscribers.get(prop);
        if (subscription && subscription instanceof Function) {
          subscription(value);
        }

        return true;
      },
    }
  );
}
