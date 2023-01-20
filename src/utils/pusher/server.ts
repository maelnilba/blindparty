import { env } from "env/server.mjs";
import type { NextApiRequest, NextApiResponse } from "next";
import Pusher from "pusher";
import { z } from "zod";

export type User = {
  id: string;
  user_info: UserInfo;
};

const userInfoSchema = z.object({
  name: z.string().nullish(),
  image: z.string().nullish(),
});

export type UserInfo = z.infer<typeof userInfoSchema>;

type AuthHandlerGetUserInfoArgs = {
  req: NextApiRequest;
  res: NextApiResponse;
  ctx: AuthHandlerContext;
};
type AuthHandlerGetUserInfoReturn<T = unknown> = {
  id: string;
  user_info: T;
};
type AuthHandlerContext = {
  socket_id: string;
  channel_name: string;
};
export function createPusherAuthHandler<TUserInfo = unknown>(
  getUserInfo: (
    args: AuthHandlerGetUserInfoArgs
  ) =>
    | Promise<AuthHandlerGetUserInfoReturn<TUserInfo> | void>
    | AuthHandlerGetUserInfoReturn<TUserInfo>
    | void
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const {
      socket_id,
      channel_name,
    }: { socket_id: string; channel_name: string } = req.body;

    const user = await getUserInfo({
      req: req,
      res: res,
      ctx: {
        socket_id,
        channel_name,
      },
    });

    if (!user) {
      return;
    }

    const pusher =
      global.pusher ||
      new Pusher({
        appId: env.PUSHER_APP_ID,
        cluster: env.PUSHER_CLUSTER,
        key: env.PUSHER_KEY,
        secret: env.PUSHER_SECRET,
      });

    if (env.NODE_ENV !== "production") {
      global.pusher = pusher;
    }

    const authResponse = pusher.authorizeChannel(socket_id, channel_name, {
      user_id: user.id,
      user_info: user.user_info as any,
    });
    res.send(authResponse);
  };
}

export const publicChannelProcedureSchema = z.object({
  prpc: z.object({
    channel_type: z.string().optional(),
    channel_id: z.string().optional(),
    channel_name: z.string().optional(),
    channel_event: z.string(),
  }),
});

export const presenceChannelProcedureSchema = z.object({
  prpc: z.object({
    channel_type: z.string().optional(),
    channel_id: z.string().optional(),
    channel_name: z.string().optional(),
    channel_event: z.string(),
    socket_id: z.string().optional(),
    members: z.object({}).catchall(userInfoSchema),
    me: z.object({
      id: z.string(),
      info: userInfoSchema,
    }),
  }),
});

type InputPresenceChannel = z.infer<typeof presenceChannelProcedureSchema>;
type InputPublicChannel = z.infer<typeof publicChannelProcedureSchema>;

export interface PublicInput extends InputPublicChannel {
  [key: string]: any;
}
export interface PresenceInput extends InputPresenceChannel {
  [key: string]: any;
}

declare global {
  // eslint-disable-next-line no-var
  var pusher: Pusher | undefined;
}

export const createPRPCServer = (opts: Pusher.Options) => {
  const pusher = global.pusher || new Pusher(opts);
  if (env.NODE_ENV !== "production") {
    global.pusher = pusher;
  }
  return (input: InputPresenceChannel | InputPublicChannel) =>
    new PRPCChannelServer(pusher, input);
};

class PRPCChannelServer {
  private pusher: Pusher;
  private channel_type: string | undefined;
  private channel_id: string | undefined;
  private channel_name: string | undefined;
  private channel_event: string;
  private socket_id: string | undefined;
  constructor(
    pusher: Pusher,
    input: InputPresenceChannel | InputPublicChannel
  ) {
    this.pusher = pusher;
    this.channel_type = input.prpc.channel_type;
    this.channel_event = input.prpc.channel_event;
    this.channel_id = input.prpc.channel_id;
    this.channel_name = input.prpc.channel_name;
  }

  async trigger<T>(data: T): Promise<T> {
    const channel = [
      this.channel_type === "public" ? null : this.channel_type,
      this.channel_name,
      this.channel_id,
    ]
      .filter((x) => x)
      .join("-");

    return this.pusher.trigger(channel, this.channel_event, data) as any;
  }

  async sendToUser<T>(userId: string, data: T): Promise<T> {
    return this.pusher.sendToUser(userId, this.channel_event, data) as any;
  }
}
