import type {
  AnyProcedure,
  AnyRouter,
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
import Pusher, {
  Channel,
  Members as PusherMembers,
  Options,
  PresenceChannel,
} from "pusher-js";
import { useCallback, useEffect, useRef, useState } from "react";
import { serialize } from "superjson";
import { type AppRouter } from "../../server/api/root";
import { api } from "../api";
import type { PresenceInput, PublicInput, User, UserInfo } from "./server";
import { listen, mute } from "./ws-interceptor";
interface Members extends PusherMembers {
  me: User;
  members: { [key: User["id"]]: UserInfo };
  myID: User["id"];
}

type PusherEvent =
  | "pusher:subscription_succeeded"
  | "pusher:subscription_error"
  | "pusher:cache_miss"
  | "pusher:subscription_count"
  | "pusher:error"
  | "pusher:member_added"
  | "pusher:member_removed"
  | "pusher:connection_established"
  | "pusher:connection_failed"
  | "pusher:member_updated"
  | "pusher:presence_diff"
  | "pusher:client-event";

const channels = [
  "public",
  "private",
  "encrypted",
  "presence",
  "cache",
] as const;
type ChannelType = (typeof channels)[number];
const channelsWithMember = ["private", "presence", "encrypted"] as const;
type ChannelWithMember = (typeof channelsWithMember)[number];
type ChannelOptions = {
  type?: ChannelType;
  id?: string | number;
  subscribeOnMount?: boolean;
};

type ExtractRouterProxy<TRouter extends AnyRouter> = {
  [P in keyof TRouter as TRouter[P] extends AnyRouter ? P : never]: {
    useChannel: <TOptions extends ChannelOptions>(
      opts: TOptions,
      binding: ((...args: any[]) => () => void) | ((...args: any[]) => void)
    ) => PusherRPCChannel<keyof ExtractProcedure<TRouter[P]>, P, TRouter> &
      ReturnType<typeof useChannel<TRouter, TOptions["type"]>>;
  };
};

type ExtractProcedure<T extends any> = {
  [P in keyof T as T[P] extends AnyProcedure ? P : never]: T[P];
};

type PusherOptions = {
  app_key: string;
  options: Options;
};

type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
type Mutable<T> = {
  -readonly [key in keyof T]: T[key];
};

type BindEventOutput<
  TEvent,
  TChannel extends keyof TRouter,
  TRouter extends AnyRouter
> = TEvent extends PusherEvent
  ? unknown
  : TEvent extends keyof TRouter[TChannel]
  ? inferRouterOutputs<TRouter>[TChannel][TEvent]
  : never;

type BindEventInput<
  TEvent,
  TChannel extends keyof TRouter,
  TRouter extends AnyRouter
> = TEvent extends keyof TRouter[TChannel]
  ? Without<inferRouterInputs<TRouter>[TChannel][TEvent], "prpc">
  : never;

type ChannelApiInput = PublicInput | PresenceInput | undefined;

function createPRPCRouter<TRouter extends AnyRouter>(
  api: any,
  pusherOpts: PusherOptions
) {
  const proxy = new Proxy(
    {},
    {
      get: function (router: any, channel: string) {
        return {
          useChannel: (
            opts: ChannelOptions,
            binding:
              | ((...args: any[]) => () => void)
              | ((...args: any[]) => void)
          ) =>
            useChannel<TRouter, ChannelOptions["type"]>(
              api,
              channel as keyof TRouter,
              pusherOpts,
              opts,
              binding
            ),
        };
      },
    }
  ) as ExtractRouterProxy<TRouter>;

  return {
    channel: proxy,
  };
}

Pusher.logToConsole =
  process.env.NODE_ENV !== "production" && typeof window !== "undefined";

let pusherClient: Pusher | null = null;
export function useChannel<
  TRouter extends AnyRouter,
  TChannelType extends ChannelType | undefined
>(
  api: any,
  channel: keyof TRouter,
  pusherOpts: PusherOptions,
  opts: ChannelOptions,
  binding: ((...args: any[]) => () => void) | ((...args: any[]) => void)
) {
  const { getQueryKey } = api[channel];

  const pusher =
    typeof window !== "undefined"
      ? pusherClient || new Pusher(pusherOpts.app_key, pusherOpts.options)
      : undefined;

  const [me, setMe] =
    useState<
      TChannelType extends ChannelWithMember ? User | undefined : never
    >();
  const [members, setMembers] =
    useState<
      TChannelType extends ChannelWithMember
        ? Members["members"] | undefined
        : never
    >();
  const [isSubscribe, setisSubscribe] = useState<boolean | undefined>();
  const [subscribeError, setSubscribeError] = useState<boolean | undefined>();

  const handleSubscribe = useCallback((channel: Channel | PresenceChannel) => {
    setisSubscribe(false);
    channel.bind("pusher:subscription_succeeded", (members: Members) => {
      setisSubscribe(true);
      setMembers(members.members as any);
      setMe(members.me as any);
    });

    channel.bind("pusher:subscription_error", () => {
      setisSubscribe(true);
      setSubscribeError(true);
    });

    if (opts.type === "presence") {
      channel.bind("pusher:member_added", (user: User) => {
        if (!members) {
          return;
        }
        setMembers(
          (members) => ({ ...members, [user.id]: user.user_info } as any)
        );
      });

      channel.bind("pusher:member_removed", (user: User) => {
        if (!members) {
          return;
        }
        setMembers((members) => {
          members && delete members[user.id];
          return { ...members } as any;
        });
      });
    }
  }, []);

  const channelRef = useRef<PusherRPCChannel<any, typeof channel, TRouter>>(
    new PusherRPCChannel(pusher!, channel.toString(), handleSubscribe, opts)
  );

  useEffect(() => {
    if (!pusherClient) {
      pusherClient = pusher!;
    }

    if (opts.subscribeOnMount) {
      channelRef.current.subscribe();
    }

    listen((data: { event: string; data: any }) => {
      if (data.event === "pusher:connection_established") {
        channelRef.current?.setSocketId(data.data.socket_id);
        mute();
      }
    });

    return () => {
      mute();
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  // Handle binding after channel and pusher are done
  useEffect(() => {
    let cleanup: any;
    if (isSubscribe) {
      cleanup = binding();
    }

    return () => {
      if (isSubscribe) {
        if (cleanup instanceof Function) {
          cleanup();
        }
      }
    };
  }, [isSubscribe]);

  const bind = ((...args: any[]) => {
    // @ts-ignore
    channelRef.current.bind(...args);
  }) as typeof channelRef.current.bind;

  const send = ((...args: any[]) => {
    // @ts-ignore
    let { input } = channelRef.current.send(...args);

    if (opts.type === "presence") {
      // @ts-ignore
      input.prpc["members"] = members;
      // @ts-ignore
      input.prpc["me"] = me;
    }

    const apiUrl =
      "/api/trpc/" +
      [getQueryKey(), input.prpc.channel_event].join(".").replace(",", ".") +
      "?batch=1";

    const { json } = serialize(input);

    // Find how use superjson
    fetch(apiUrl, {
      method: "POST",
      body: `{"0":{"json":${JSON.stringify(input)}}}`,
    });
  }) as typeof channelRef.current.send;

  const subscribe = ((...args: any[]) => {
    // @ts-ignore
    channelRef.current.subscribe(...args);
  }) as typeof channelRef.current.subscribe;

  const unsubscribe = ((...args: any[]) => {
    // @ts-ignore
    channelRef.current.unsubscribe(...args);
  }) as typeof channelRef.current.unsubscribe;

  return {
    bind: bind,
    send: send,
    subscribe: subscribe,
    unsubscribe: unsubscribe,
    me,
    members,
    isSubscribe: isSubscribe,
    isSubcribeError: subscribeError,
  };
}

export class PusherRPCChannel<
  TProcedures extends string | number | symbol,
  TChannel extends keyof TRouter,
  TRouter extends AnyRouter
> {
  private pusher: Pusher;
  private pusher_channel_name: string;
  private channel_name: string;
  private options: ChannelOptions | undefined;
  private handler: (channel: Channel | PresenceChannel) => void;
  private channel: Channel | PresenceChannel | undefined;
  private socket_id: string | undefined;

  constructor(
    pusher: Pusher,
    channel: string,
    handler: (channel: Channel | PresenceChannel) => void,
    options?: ChannelOptions
  ) {
    this.pusher = pusher;
    this.channel_name = channel;
    this.pusher_channel_name = channel;
    this.handler = handler;
    this.setOptions(options);
  }

  setOptions(opts?: ChannelOptions) {
    this.pusher_channel_name = [
      opts?.type === "public" ? null : opts?.type,
      this.pusher_channel_name,
      opts?.id,
    ]
      .filter((x) => x)
      .join("-");

    this.options = opts;
  }

  setSocketId(id: string) {
    this.socket_id = id;
  }

  subscribe() {
    this.channel = this.pusher.subscribe(this.pusher_channel_name);
    this.handler(this.channel);
  }

  unsubscribe() {
    this.pusher.unsubscribe(this.pusher_channel_name);
    this.channel = undefined;
  }

  bind<TEvent extends string & (TProcedures | PusherEvent)>(
    event: TEvent,
    listener: (data: BindEventOutput<TEvent, TChannel, TRouter>) => void
  ) {
    if (!this.channel) {
      throw new Error(
        `Channel ${this.pusher_channel_name} need to be subscribed before binding`
      );
    }
    return this.channel.bind(event, listener);
  }

  unbind<TEvent extends string & (TProcedures | PusherEvent)>(
    event: TEvent,
    listener: (data: BindEventOutput<TEvent, TChannel, TRouter>) => void
  ) {
    if (!this.channel) {
      throw new Error(
        `Channel ${this.pusher_channel_name} need to be subscribed before unbinding`
      );
    }
    return this.channel.unbind(event, listener);
  }

  send<TEvent extends string & TProcedures>(
    event: TEvent,
    data: BindEventInput<TEvent, TChannel, TRouter>
  ) {
    const input = {
      prpc: {
        channel_type: this.options?.type,
        channel_id: this.options?.id
          ? typeof this.options.id === "string"
            ? this.options.id
            : this.options.id.toString()
          : undefined,
        channel_name: this.channel_name,
        channel_event: event,
        socket_id: this.socket_id,
      },
    };

    return {
      input: { ...input, ...(data as object) },
    };
  }
}

export const push = createPRPCRouter<AppRouter["party"]>(api.party, {
  app_key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  options: {
    authEndpoint: "/api/pusher/auth",
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  },
});
