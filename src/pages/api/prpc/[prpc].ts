import { createNextApiHandler } from "@prpc/server";
import { prpc } from "@server/api/prpc";
import { env } from "../../../env/server.mjs";

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
