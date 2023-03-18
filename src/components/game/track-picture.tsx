import { RouterOutputs } from "@utils/api";

type TrackPictureProps = RouterOutputs["party"]["game"]["round"];

export const TrackBluredPicture = ({ track }: TrackPictureProps) => {
  const image = track?.album.images.filter((i) => i.url).at(0);

  return (
    <img
      className="absolute"
      width={600}
      src={"/api/og/blur?src=" + image?.url.split("").reverse().join("")}
    />
  );
};

export const TrackPicture = ({
  track,
  className,
}: TrackPictureProps & { className?: string }) => {
  const image = track?.album.images.filter((i) => i.url).at(0);

  return <img className={className} src={image?.url} />;
};
