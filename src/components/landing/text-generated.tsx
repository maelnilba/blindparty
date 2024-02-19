"use client";
import { motion, stagger, useAnimate } from "framer-motion";
import { ComponentProps, useEffect } from "react";

type TextGeneratedProps = Omit<ComponentProps<"div">, "children" | "ref"> & {
  children: string;
  separator?: string;
};
export const TextGenerated = ({
  children,
  separator,
  ...props
}: TextGeneratedProps) => {
  const [scope, animate] = useAnimate();
  let wordsArray = children.split(separator ?? " ");
  useEffect(() => {
    animate(
      "span",
      {
        opacity: 1,
      },
      {
        duration: 5,
        delay: stagger(0.2),
      }
    );
  }, [scope.current]);

  const renderWords = () => {
    return (
      <motion.div ref={scope}>
        {wordsArray.map((word, idx) => {
          return (
            <motion.span key={word + idx} className="text-white opacity-0">
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    );
  };

  return (
    <div {...props}>
      <div className="mt-4">
        <div className=" text-2xl leading-snug tracking-wide text-white">
          {renderWords()}
        </div>
      </div>
    </div>
  );
};
