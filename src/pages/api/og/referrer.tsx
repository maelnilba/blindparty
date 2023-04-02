import { ImageResponse } from "@vercel/og";
import { type NextRequest } from "next/server";

export const config = {
  runtime: "experimental-edge",
};

export default async function (req: NextRequest) {
  const ref = req.referrer;
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {ref}
      </div>
    ),
    {
      width: 600,
      height: 600,
    }
  );
}
