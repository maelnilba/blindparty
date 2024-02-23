import clsx from "clsx";
import {
  ComponentProps,
  createContext,
  PropsWithChildren,
  useContext,
} from "react";
import { twMerge } from "tailwind-merge";

type Timing =
  | "ease"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | "infinite"
  | `cubic-bezier(${number},${number},${number},${number})`;

const SquareContext = createContext<
  | {
      active: boolean;
      speed: number;
      timing: Timing;
    }
  | undefined
>(undefined);

type SquareProps = PropsWithChildren<ComponentProps<"div">> & {
  active?: boolean;
  speed?: number;
  timing?: Timing;
};
export const Square = ({
  children,
  active = true,
  speed = 2,
  timing = "infinite",
  ...props
}: SquareProps) => {
  const { className, ...p } = props;

  return (
    <SquareContext.Provider
      value={{
        active,
        speed,
        timing,
      }}
    >
      <div className={`relative ${className}`} {...p}>
        {children}
      </div>
    </SquareContext.Provider>
  );
};

Square.Child = ({
  children,
  ...props
}: PropsWithChildren<ComponentProps<"div">>) => {
  const { className, ...p } = props;

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center ${className}`}
      {...p}
    >
      {children}
    </div>
  );
};

type SquareDashProps = ComponentProps<"svg"> & {
  parent?: ComponentProps<"div">;
};

const useSquare = () => {
  const context = useContext(SquareContext);
  if (context === undefined) {
    throw new Error(`useSquare must be used within a SquareContext.`);
  }
  return context;
};

Square.Dash = ({ parent, ...props }: SquareDashProps) => {
  const { className, ...div } = parent ?? { className: "rounded" };
  const { active, speed, timing } = useSquare();

  return (
    <div
      className={twMerge(clsx("h-full w-full overflow-hidden", className))}
      {...div}
    >
      <svg
        viewBox="0 0 200 200"
        className="h-full w-full"
        stroke="white"
        strokeWidth="8"
        {...props}
      >
        <path
          style={{
            animation: active
              ? `${
                  timing === "infinite" ? "dash-twice" : "dash"
                } ${speed}s ${timing} 0s forwards`
              : undefined,
          }}
          d="M 2,12, L 2,2 L 198,2 198,198 L 2,198 2,2"
          // Reversed
          // d="M2 12L2 188 L 2,198 20,198 L 188 198 L198,198 198,188 L198 12 L198,2 188,2 L12 2 L2,2 2,12z"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="400%"
          strokeDashoffset="400%"
        />
      </svg>
    </div>
  );
};
