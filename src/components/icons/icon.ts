import { SVGProps } from "react";

export interface Icon extends SVGProps<SVGSVGElement> {
  category?: "outline" | "solid" | "mini";
}
