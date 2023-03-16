import defaultcolors from "tailwindcss/colors";

type Writeable<T> = { -readonly [P in keyof T]: T[P] };

const tailwindColors = [
  "black",
  "white",
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
] as const;
type Colors = (typeof tailwindColors)[number];
const tailwindVariations = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900,
] as const;
type Variations = (typeof tailwindVariations)[number];
type Attr = "bg" | "border" | "text";
type Options = {
  exclude?: Colors[];
  variationMin?: Variations;
  variationMax?: Variations;
};

type TailwindValue =
  | `${Attr}-${Exclude<Colors, "black" | "white">}-${Variations}`
  | `${Attr}-${Colors}`
  | `#${string}`;

export const random = (attr?: Attr, options?: Options): TailwindValue => {
  let colors = tailwindColors as any as Writeable<Colors[]>;
  let variations = tailwindVariations as any as Writeable<Variations[]>;

  if (options) {
    if (options.exclude) {
      colors = colors.filter((c) => !options.exclude!.includes(c));
    }
    if (options.variationMin) {
      variations = variations.filter((v) => v >= options.variationMin!);
    }
    if (options.variationMax) {
      variations = variations.filter((v) => v <= options.variationMax!);
    }
  }

  const color = colors[Math.floor(Math.random() * colors.length)];
  const variation = variations[Math.floor(Math.random() * variations.length)];
  if (!color) {
    throw new Error(
      "No color possible, you might have exclude all possible colors"
    );
  }

  if (!variation) {
    throw new Error(
      "No variation possible, you might have set impossible with min and max"
    );
  }

  if (!attr) {
    if (color === "white" || color === "black") {
      return defaultcolors[color];
    }
    return defaultcolors[color][variation] as `#${string}`;
  }

  if (color === "white" || color === "black") {
    return `${attr}-${color}`;
  }

  return `${attr}-${color}-${variation}`;
};

export const raw = (color: Colors, variation: Variations) => {
  if (color === "black" || color === "white") {
    return defaultcolors[color];
  }

  return defaultcolors[color][variation];
};
