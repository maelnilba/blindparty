import { ImageIcon } from "@components/icons/image";

type PlaceholderProps = {
  className: string;
};
export const Placeholder = (props: PlaceholderProps) => {
  return (
    <picture
      className={`${props.className} flex items-center justify-center rounded border border-gray-800 text-white`}
    >
      <ImageIcon className="h-6 w-6" />
    </picture>
  );
};
