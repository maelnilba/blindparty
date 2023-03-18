import { env } from "../env/server.mjs";
import { S3, config } from "aws-sdk";

config.update({
  accessKeyId: process.env.APP_AWS_ACCESS_KEY,
  secretAccessKey: process.env.APP_AWS_SECRET_KEY,
  region: process.env.APP_AWS_REGION,
  signatureVersion: "v4",
});

declare global {
  // eslint-disable-next-line no-var
  var s3: S3 | undefined;
}

export const s3 =
  global.s3 ||
  new S3({
    accessKeyId: process.env.APP_AWS_ACCESS_KEY,
    secretAccessKey: process.env.APP_AWS_SECRET_KEY,
    region: process.env.APP_AWS_REGION,
    signatureVersion: "v4",
  });

if (env.NODE_ENV !== "production") {
  global.s3 = s3;
}
