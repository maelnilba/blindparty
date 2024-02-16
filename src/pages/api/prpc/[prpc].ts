import {
  createNextApiHandler,
  createNextWehbookApiHandler,
} from "modules/prpc/server";
import { prpc } from "@server/api/prpc";
import { env } from "../../../env/server.mjs";

const webhooks = createNextWehbookApiHandler<typeof prpc>({
  existence: async (data, ctx) => {
    if (data.name === "channel_vacated") {
      await ctx.prisma.party.updateMany({
        where: { id: data.channel.id, status: "RUNNING" },
        data: {
          status: "CANCELED",
        },
      });
    }
  },
  presence: async (data, ctx) => {
    if (data.name === "member_removed") {
      await ctx.prisma.party.update({
        where: {
          id: data.channel.id,
        },
        data: {
          players: {
            delete: {
              id: data.user_id,
            },
          },
        },
      });
    }
  },
});

export default createNextApiHandler({
  router: prpc,
  webhooks,
  onError:
    env.NODE_ENV === "development"
      ? ({ channel_name, message }) => {
          console.error(
            `❌  failed on ${channel_name ?? "<no-path>"}: ${message}`
          );
        }
      : undefined,
});
