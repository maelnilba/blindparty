import type { NextApiRequest, NextApiResponse } from "next";
import { type ZodObject } from "zod";
import {
  authHandlerBodySchema,
  getChannelName,
  isChannelWithMember,
  parseChannelName,
  parseUserJson,
} from "../shared/utils";
import { PRPCBuilder } from "./PRPCBuilder";
import { PRPCPresenceRouteTRPC } from "./PRPCRouteTRPC";
import type { NextApiHandler, PRPCInternalRouter } from "./types";

export const initPRPC = {
  context: function () {
    return new PRPCBuilder();
  },
};

export const createNextApiHandler: NextApiHandler = ({
  router: r,
  onError,
}) => {
  const router = r as any as PRPCInternalRouter;
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const { ...query } = req.query;
    const { socket_id, channel_name, ...body } = req.body;

    const pusherAuthCtx = authHandlerBodySchema.parse({
      socket_id: socket_id,
      channel_name: channel_name,
    });

    const prpc_route = getChannelName(pusherAuthCtx.channel_name);
    if (!router[prpc_route]) {
      onError &&
        onError({
          message: "Route not found in PRPC router",
          channel_name: pusherAuthCtx.channel_name,
        });
      return;
    }

    if (isChannelWithMember(router[prpc_route]!._defs.builder._defs.type)) {
      const route = router[prpc_route] as PRPCPresenceRouteTRPC<
        any,
        ZodObject<any>,
        any
      >;

      const user = parseUserJson(body);

      try {
        const ctx = await router._defs.ctx({ req: req, res: res });
        const data = await route._defs.builder._defs.auth_handler({
          req: req,
          res: res,
          data: {
            ...user,
            socket_id: pusherAuthCtx.socket_id,
            channel: parseChannelName(pusherAuthCtx.channel_name),
          },
          ctx: ctx,
        });

        const authResponse = router._defs.pusher.authorizeChannel(
          pusherAuthCtx.socket_id,
          pusherAuthCtx.channel_name,
          {
            user_id: String(Math.random() * 1000),
            user_info: data,
          }
        );
        res.send(authResponse);
      } catch (error: any) {
        onError &&
          onError({
            message: "Error with the auth function",
            channel_name: pusherAuthCtx.channel_name,
          });
      }
    } else {
      res.send(null);
    }
  };
};
