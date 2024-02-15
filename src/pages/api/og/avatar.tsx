import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function (req: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ff6961",
          color: "white",
        }}
      >
        <p style={{ fontSize: 424 }}>🥶</p>
      </div>
    ),
    {
      width: 600,
      height: 600,
    }
  );
}
