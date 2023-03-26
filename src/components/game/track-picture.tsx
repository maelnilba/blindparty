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

export const TrackBluredPicture = ({ track }: TrackPictureProps) => {
  const image = track?.album.images.filter((i) => i.url).at(0) ?? { url: "" };
  const url = validator.createSearchURL({
    src: image.url.split("").reverse().join(""),
    blur: 36,
  });

  const apiUrl = `http://localhost:3000/api/og/blur${url}`;

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
  const image = track?.album.images.filter((i) => i.url).at(0);

  return <img {...props} src={image?.url} />;
};
