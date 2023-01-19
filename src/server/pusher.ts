import { env } from "env/server.mjs";
import Pusher from "pusher";

declare global {
  // eslint-disable-next-line no-var
  var pusher: Pusher | undefined;
}

export const pusher =
  global.pusher ||
  new Pusher({
    appId: env.PUSHER_APP_ID!,
    key: env.PUSHER_KEY!,
    secret: env.PUSHER_SECRET!,
    cluster: env.PUSHER_CLUSTER!,
    useTLS: true,
  });

if (env.NODE_ENV !== "production") {
  global.pusher = pusher;
}
