import { env } from "../env/server.mjs";
import { S3, config } from "aws-sdk";

config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
  signatureVersion: "v4",
});

declare global {
  // eslint-disable-next-line no-var
  var s3: S3 | undefined;
}

export const s3 =
  global.s3 ||
  new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
    signatureVersion: "v4",
  });

if (env.NODE_ENV !== "production") {
  global.s3 = s3;
}

export const pictureLink = (key: string | undefined) =>
  key
    ? `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : undefined;
