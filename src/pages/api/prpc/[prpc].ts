import { env } from "../../../env/server.mjs";
import { prpc } from "@server/api/prpc";
import { createNextApiHandler } from "@prpc/server";

export default createNextApiHandler({
  router: prpc,
  onError:
    env.NODE_ENV === "development"
      ? ({ channel_name, message }) => {
          console.error(
            `❌  failed on ${channel_name ?? "<no-path>"}: ${message}`
          );
        }
      : undefined,
});
