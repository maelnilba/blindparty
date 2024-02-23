import { ImageIcon } from "@components/icons/image";
import { twMerge } from "tailwind-merge";

type PlaceholderProps = {
  className: string;
};
export const Placeholder = ({ className }: PlaceholderProps) => {
  return (
    <picture
      className={twMerge(
        className,
        "flex items-center justify-center rounded border border-gray-800 text-white"
      )}
    >
      <ImageIcon className="h-6 w-6" />
    </picture>
  );
};
