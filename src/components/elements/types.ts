import {
  JSXElementConstructor,
  ReactElement,
  ReactFragment,
  ReactPortal,
} from "react";

export type Element =
  | string
  | number
  | ReactElement<any, string | JSXElementConstructor<any>>
  | ReactFragment
  | ReactPortal;
