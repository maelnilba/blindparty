"use client";
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import React, {
  Children,
  ComponentPropsWithoutRef,
  ReactNode,
  createContext,
  isValidElement,
  useContext,
  useRef,
} from "react";

export const ContainerScroll = () => {};

const Context = createContext<{
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  translate: MotionValue<number>;
}>({ rotate: null as any, scale: null as any, translate: null as any });

ContainerScroll.Root = ({
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) => {
  const containerRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
  });
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const scaleDimensions = () => {
    return isMobile ? [0.7, 0.9] : [1.05, 1];
  };

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  const header = Children.map(children, (child) =>
    isValidElement(child) && child.type === ContainerScroll.Header
      ? child
      : false
  );
  const content = Children.map(children, (child) =>
    isValidElement(child) && child.type === ContainerScroll.Content
      ? child
      : false
  );

  return (
    <Context.Provider value={{ rotate, scale, translate }}>
      <div {...props} ref={containerRef}>
        <div
          className="relative w-full py-40"
          style={{
            perspective: "1000px",
          }}
        >
          {header} {content}
        </div>
      </div>
    </Context.Provider>
  );
};

ContainerScroll.Header = ({
  children,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) => {
  const { translate } = useContainerScroll();

  return (
    <motion.div
      style={{
        translateY: translate,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

ContainerScroll.Content = ({
  children,
  ...props
}: HTMLMotionProps<"div"> & { children: ReactNode }) => {
  const { rotate, scale, translate } = useContainerScroll();
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
      }}
      {...props}
    >
      <div className="grid h-full w-full grid-cols-1 gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 p-4 md:grid-cols-3 lg:grid-cols-5">
        {Children.map(children, (child, idx: number) => (
          <motion.div
            key={idx}
            className="relative h-fit cursor-pointer rounded-md"
            style={{ translateY: translate }}
            whileHover={{
              boxShadow:
                "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
            }}
          >
            {child}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export function useContainerScroll() {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error(
      `useContainerScroll must be used within a ContainerScroll.Root.`
    );
  }
  return context;
}
