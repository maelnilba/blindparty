import { isValidElement, ReactElement, ReactNode, useState } from "react";
import { Placeholder } from "./placeholder";

type PictureProps = {
  children: ReactElement<{ [key: string]: any; className: string }>;
  identifier: any | null | undefined;
  className?: string;
};
export const Picture = ({
  children,
  identifier: _identifier,
  className: pClassName,
}: PictureProps) => {
  const [identifier, setIdentifier] = useState(_identifier);
  const className = isValidElement(children) ? children.props.className : "";
  if (!identifier) {
    return <Placeholder className={className} />;
  }
  return (
    <picture className={pClassName} onErrorCapture={() => setIdentifier(false)}>
      {children}
    </picture>
  );
};
