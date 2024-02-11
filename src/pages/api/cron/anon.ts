import { prisma } from "@server/db";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const APP_KEY = process.env.GH_API_KEY;
  // @ts-ignore

  try {
    const ACTION_KEY = req.headers.authorization?.split(" ")[1];

    if (ACTION_KEY === APP_KEY) {
      // Delete all anon user which are not actually in a room
      await prisma.user.deleteMany({
        where: {
          role: "ANON",
          players: {
            none: {
              party: {
                OR: [{ status: "PENDING" }, { status: "RUNNING" }],
              },
            },
          },
        },
      });

      res.status(200).json({ success: "true" });
    } else {
      res.status(401);
    }
  } catch (err) {
    res.status(500);
  }
}
