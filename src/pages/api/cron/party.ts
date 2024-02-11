import { prisma } from "@server/db";
import { ONE_DAY_IN_MS, THIRTY_MINUTES_IN_MS } from "helpers/date";
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
      // Delete all party which are not started and old of 1 day
      await prisma.party.deleteMany({
        where: {
          endedAt: null,
          createdAt: {
            lt: new Date(Date.now() - ONE_DAY_IN_MS).toISOString(),
          },
          OR: [{ status: "PENDING" }, { status: "CANCELED" }],
        },
      });

      // Set status to CANCELED to party that do not have update since 30 minutes but in RUNNING
      // Means all players leave the party or a bug occured
      await prisma.party.updateMany({
        where: {
          endedAt: null,
          status: "RUNNING",
          updatedAt: {
            lt: new Date(Date.now() - THIRTY_MINUTES_IN_MS).toISOString(),
          },
        },
        data: {
          status: "CANCELED",
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
