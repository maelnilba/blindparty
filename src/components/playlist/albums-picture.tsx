export const AlbumsPicture = ({
  row1,
  row2,
  className,
}: {
  row1: string[];
  row2: string[];
  className?: string;
}) => {
  return (
    <div
      className={`${
        className ?? ""
      } group relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded border border-gray-800 object-cover text-white`}
    >
      <picture>
        {row1.map((source, id) => (
          <img className="aspect-square" key={id} src={source} />
        ))}
      </picture>
      <picture>
        {row2.map((source, id) => (
          <img className="aspect-square" key={id} src={source} />
        ))}
      </picture>
    </div>
  );
};
