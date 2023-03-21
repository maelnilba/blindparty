import { isValidElement, ReactElement, useState } from "react";
import { Placeholder } from "./placeholder";

type PictureProps = {
  children: ReactElement<{ [key: string]: any; className: string }>;
  identifier: any | null | undefined;
  className?: string;
};
export const Picture = ({
  children,
  identifier,
  className: pClassName,
}: PictureProps) => {
  const [error, setError] = useState(false);
  const className = isValidElement(children) ? children.props.className : "";
  if (!identifier || error) {
    return <Placeholder className={className} />;
  }
  return (
    <picture className={pClassName} onErrorCapture={() => setError(true)}>
      {children}
    </picture>
  );
};
