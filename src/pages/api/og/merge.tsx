import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { createQueryValidator } from "./#";

export const config = {
  runtime: "experimental-edge",
};

const validator = createQueryValidator(
  z.object({
    sources: z.array(z.string().url()).length(4),
  })
);

export default async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { sources } = validator.validate(searchParams);
  const [row1, row2] = [sources.slice(0, 2), sources.slice(2, 4)];
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          width: "100%",
        }}
      >
        <picture tw="flex">
          {row1.map((source, id) => (
            <img
              className="col-span-1"
              width={300}
              height={300}
              key={id}
              src={source}
            />
          ))}
        </picture>
        <picture tw="flex">
          {row2.map((source, id) => (
            <img
              className="col-span-1"
              width={300}
              height={300}
              key={id}
              src={source}
            />
          ))}
        </picture>
      </div>
    ),
    {
      width: 600,
      height: 600,
    }
  );
}
