import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@server/db";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = prisma;
  res.status(200).json({ name: "John Doe" });
}
