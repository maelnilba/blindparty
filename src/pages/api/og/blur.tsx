import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createQueryValidator } from "@lib/query-validator";

export const config = {
  runtime: "experimental-edge",
};

const validator = createQueryValidator(
  z.object({
    src: z.string(),
  })
);

export default async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { src } = validator.validate(searchParams);

  const _src = src.split("").reverse().join("");

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
        <img placeholder="blur" src={_src} />
      </div>
    ),
    {
      width: 600,
    }
  );
}
