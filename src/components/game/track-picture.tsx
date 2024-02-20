import { RouterOutputs } from "@utils/api";
import { getBaseUrl } from "helpers/base-url";
import { createQueryValidator } from "helpers/query-validator";
import { ComponentProps } from "react";
import { z } from "zod";
type TrackPictureProps = RouterOutputs["party"]["game"]["round"];

const validator = createQueryValidator(
  z.object({
    src: z.string(),
    blur: z.number().min(1),
  })
);

export const TrackBluredPicture = ({ track }: TrackPictureProps) => {
  const image = track?.images.filter((i) => i.url).at(-1) ?? { url: "" };
  const url = validator.createSearchURL({
    src: image.url.split("").reverse().join(""),
    blur: 36,
  });

  const apiUrl = `${getBaseUrl()}/api/og/blur${url}`;

  return (
    <img
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
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
