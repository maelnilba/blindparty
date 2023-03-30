import { createQueryValidator } from "@lib/helpers/query-validator";
import { RouterOutputs } from "@utils/api";
import { z } from "zod";
import Image from "next/image";
import { ComponentProps } from "react";
type TrackPictureProps = RouterOutputs["party"]["game"]["round"];

const validator = createQueryValidator(
  z.object({
    src: z.string(),
    blur: z.number().min(1),
  })
);

const getBaseUrl = () => {
  if (typeof window !== "undefined") return window.origin; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export const TrackBluredPicture = ({ track }: TrackPictureProps) => {
  const image = track?.images.filter((i) => i.url).at(0) ?? { url: "" };
  const url = validator.createSearchURL({
    src: image.url.split("").reverse().join(""),
    blur: 36,
  });

  const apiUrl = `${getBaseUrl()}/api/og/blur${url}`;

  return (
    <Image
      loader={() => apiUrl}
      className="object-cover"
      width={600}
      height={600}
      src={apiUrl}
      alt={`Image blurred of track`}
    />
  );
};

export const TrackPicture = ({
  track,
  ...props
}: TrackPictureProps & Omit<ComponentProps<"img">, "src" | "srcSet">) => {
  const image = track?.images.filter((i) => i.url).at(0);

  return <img {...props} src={image?.url} />;
};
