import { SVGProps } from "react";

export interface Icon extends SVGProps<SVGSVGElement> {
  iconType?: "outline" | "solid" | "mini";
}
