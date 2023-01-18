import { isValidElement, ReactElement, ReactNode } from "react";
import { Placeholder } from "./placeholder";

type PictureProps = {
  children: ReactElement<{ [key: string]: any; className: string }>;
  identifier: any | null | undefined;
};
export const Picture = ({ children, identifier }: PictureProps) => {
  const className = isValidElement(children) ? children.props.className : "";
  if (!identifier) {
    return <Placeholder className={className} />;
  }
  return <>{children}</>;
};
