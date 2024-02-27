import { validator } from "@shared/validators/merge";
import { ImageResponse } from "@vercel/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default async function (req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const { sources } = validator.validate(searchParams);

  if (typeof sources === "string") {
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
          <picture>
            <img width={600} height={600} src={sources} />
          </picture>
        </div>
      ),
      {
        width: 600,
        height: 600,
      }
    );
  }

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
        <picture>
          {row1.map((source, id) => (
            <img width={300} height={300} key={id} src={source} />
          ))}
        </picture>
        <picture>
          {row2.map((source, id) => (
            <img width={300} height={300} key={id} src={source} />
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
