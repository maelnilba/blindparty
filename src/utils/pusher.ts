import {
  AnyProcedure,
  AnyRouter,
  inferRouterInputs,
  inferRouterOutputs,
} from "@trpc/server";
import { env } from "env/client.mjs";
import Pusher, { Channel, Options, PresenceChannel } from "pusher-js";
import { type AppRouter } from "../server/api/root";
import { api, RouterOutputs } from "./api";

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

type ChannelType = "public" | "private" | "encrypted" | "presence" | "cache";
type ChannelOptions = {
  type?: ChannelType;
  id?: string | number;
  subscribeOnMount?: boolean;
};

type ExtractRouterProxy<TRouter extends AnyRouter> = {
  [P in keyof TRouter as TRouter[P] extends AnyRouter ? P : never]: {
    useChannel: (
      opts?: ChannelOptions
    ) => PusherRPCChannel<keyof ExtractProcedure<TRouter[P]>, P, TRouter>;
  };
};

type ExtractProcedure<T extends any> = {
  [P in keyof T as T[P] extends AnyProcedure ? P : never]: T[P];
};

function useRouterChannel<TRouter extends AnyRouter>(
  api: any,
  pusher: Pusher,
  channel: keyof TRouter,
  opts?: ChannelOptions
) {
  return new PusherRPCChannel<any, any, any>(
    api,
    pusher,
    channel.toString(),
    opts
  );
}

type PusherOptions = {
  app_key: string;
  options: Options;
};

function createPRPCRouter<TRouter extends AnyRouter>(
  api: any,
  pusherOpts: PusherOptions
) {
  const router = {
    pusher: new Pusher(pusherOpts.app_key, pusherOpts.options),
  } as { [key: string]: any };
  const handler = {
    get: function (router: any, channel: string) {
      if (router[channel]) {
        return router[channel];
      } else {
        router[channel] = {
          useChannel: (opts?: ChannelOptions) =>
            useRouterChannel<TRouter>(
              api,
              router["pusher"],
              channel as keyof TRouter,
              opts
            ),
        };
        return router[channel];
      }
    },
  };
  return {
    channel: new Proxy(router, handler) as ExtractRouterProxy<TRouter>,
  };
}

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
  ? inferRouterInputs<TRouter>[TChannel][TEvent]
  : never;

type ChannelApiInput = {
  id: string;
  [key: string]: any;
};
type Api<TProcedures extends string | number | symbol> = {
  [P in TProcedures]: {
    useMutation: ({}: ChannelApiInput) => void;
  };
};
export class PusherRPCChannel<
  TProcedures extends string | number | symbol,
  TChannel extends keyof TRouter,
  TRouter extends AnyRouter
> {
  private api: Api<TProcedures>;
  private pusher: Pusher;
  private pusher_channel_name: string;
  private channel: Channel | PresenceChannel | undefined;
  constructor(
    api: any,
    pusher: Pusher,
    channel: string,
    options?: ChannelOptions
  ) {
    this.api = api[channel];
    this.pusher = pusher;
    this.pusher_channel_name = [options?.type, channel, options?.id]
      .filter((x) => x)
      .join("-");

    if (options?.subscribeOnMount) {
      this.subscribe();
    }
  }

  subscribe() {
    this.channel = this.pusher.subscribe(this.pusher_channel_name);
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

  send<TEvent extends string & TProcedures>(
    event: TEvent,
    data?: BindEventInput<TEvent, TChannel, TRouter>
  ) {
    this.api[event].useMutation;
  }
}

const push = createPRPCRouter<AppRouter["party"]>(api.party, {
  app_key: env.NEXT_PUBLIC_PUSHER_KEY,
  options: {
    authEndpoint: "/api/pusher/auth",
    cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  },
});

const { bind, send } = push.channel.game.useChannel();
bind("test", (n) => {});
send("test");
