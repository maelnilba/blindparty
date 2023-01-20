import { createPusherAuthHandler, UserInfo } from "@utils/pusher/server";
import { getServerAuthSession } from "server/auth";

export default createPusherAuthHandler<UserInfo>(async ({ req, res, ctx }) => {
  const { socket_id, channel_name } = ctx;
  const session = await getServerAuthSession({ req: req, res: res });

  if (!session || !session.user) {
    res.status(401).json({ message: "You must be logged in." });
    throw new Error("UNAUTHORIZED");
  }

  return {
    id: session.user.id,
    user_info: {
      name: session.user.name,
      image: session.user.image,
    },
  };
});
