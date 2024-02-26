import { SEPARATOR } from "@server/api/root";
import { s3 } from "@server/s3";
import { validator } from "@shared/validators/presigned";
import { getBaseUrl } from "helpers/base-url";
import { nanoid } from "nanoid";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { searchParams } = new URL(req.url!, getBaseUrl());
  const { prefix } = validator.validate(searchParams);

  const key = [prefix, nanoid()].join(SEPARATOR.S3);

  const post = s3.createPresignedPost({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Fields: {
      key: key,
    },
    Expires: 60,
    Conditions: [["content-length-range", 0, 5048576 * 5]],
  });

  res.json({ post, key });
}
