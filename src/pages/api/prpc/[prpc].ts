import {
  createNextApiHandler,
  createNextWehbookApiHandler,
} from "@prpc/server";
import { prpc } from "@server/api/prpc";
import { env } from "../../../env/server.mjs";

const webhooks = createNextWehbookApiHandler<typeof prpc>({
  existence: async (data, ctx) => {
    if (data.name === "channel_vacated") {
      await ctx.prisma.party.update({
        where: { id: data.channel.id },
        data: {
          status: "CANCELED",
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
