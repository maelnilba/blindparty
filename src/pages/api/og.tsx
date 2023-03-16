import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const config = {
  runtime: "experimental-edge",
};

export default async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const reversed_src = searchParams.get("src");
  if (!reversed_src) {
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            height: "100%",
            width: "100%",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "black",
          }}
        ></div>
      ),
      {
        width: 630,
      }
    );
  }

  const src = reversed_src?.split("").reverse().join("");

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          filter: "blur(36px)",
        }}
      >
        <img placeholder="blur" src={src!} />
      </div>
    ),
    {
      width: 600,
    }
  );
}
