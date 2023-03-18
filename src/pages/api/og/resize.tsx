import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { z } from "zod";

export const config = {
  runtime: "experimental-edge",
};

const number = z.number();
export default async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let width;
  let width_params = number.safeParse(searchParams.get("width"));
  const src = searchParams.get("src");

  if (width_params.success) {
    width = width_params.data;
  }

  return new ImageResponse(
    (
      <div
        tw="aspect-square"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          backgroundColor: !src ? "black" : "",
        }}
      >
        {src && <img tw="object-cover aspect-square" src={src} />}
      </div>
    ),
    {
      width,
    }
  );
}
