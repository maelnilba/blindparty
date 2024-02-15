import { ImageResponse } from "@vercel/og";
import { createQueryValidator } from "helpers/query-validator";
import { NextRequest } from "next/server";
import { z } from "zod";

export const config = {
  runtime: "edge",
};

const emojis = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐻‍❄️",
  "🐨",
  "🐯",
  "🦁",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🐦",
  "🐤",
  "🦄",
];

const validator = createQueryValidator(
  z.object({
    number: z.coerce.number(),
  })
);

export default async function (req: NextRequest) {
  const { number } = validator.validate(req.nextUrl.searchParams);

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
          backgroundColor: getRandomColor(number),
          color: "white",
        }}
      >
        <p style={{ fontSize: 424 }}>{emojis[number % emojis.length]}</p>
      </div>
    ),
    {
      width: 600,
      height: 600,
    }
  );
}

function getRandomColor(seed: number) {
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  let currentSeed = seed;

  function random() {
    currentSeed = (a * currentSeed + c) % m;
    return currentSeed / m;
  }

  const randomColor = () =>
    Math.floor(random() * 256)
      .toString(16)
      .padStart(2, "0");
  let color = "#" + randomColor() + randomColor() + randomColor();

  return color;
}
