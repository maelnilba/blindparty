type UrlProps = {
  children: string;
};
export const Url = ({ children }: UrlProps) => {
  const url = children.startsWith(" ")
    ? children
    : children.endsWith(" ")
    ? children + " "
    : " " + children + " ";

  return (
    <span className="cursor-pointer rounded-lg font-extrabold ring-2 ring-white ring-opacity-5 hover:opacity-75">
      {url}
    </span>
  );
};
