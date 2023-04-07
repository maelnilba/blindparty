import * as RadixSlider from "@radix-ui/react-slider";
import { forwardRef, useEffect, useRef } from "react";

export const Slider = forwardRef<
  HTMLSpanElement,
  RadixSlider.SliderProps & { preview?: boolean }
>(
  (
    {
      preview: _preview = false,
      className,
      orientation = "horizontal",
      ...props
    },
    forwardRef
  ) => {
    // Preview tracking
    const preview = useRef<HTMLDivElement>(null);
    const area = useRef<HTMLDivElement>(null);
    useEffect(() => {
      if (!_preview) return;

      const tracker = (e: PointerEvent) => {
        if (!area.current) return;
        if (!preview.current) return;
        const areaRect = area.current.getBoundingClientRect();
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const areaX = areaRect.left;
        const areaY = areaRect.top;
        const areaWidth = areaRect.width;
        const areaHeight = areaRect.height;

        if (
          mouseX >= areaX &&
          mouseX <= areaX + areaWidth &&
          mouseY >= areaY &&
          mouseY <= areaY + areaHeight
        ) {
          if (preview.current.style.opacity === "0")
            preview.current.style.opacity = "1";
          const percentage =
            orientation === "horizontal"
              ? ((mouseX - areaX) / areaWidth) * 100
              : ((mouseY - areaY) / areaHeight) * 100;

          orientation === "horizontal"
            ? (preview.current.style.width = `${Math.round(percentage)}%`)
            : (preview.current.style.height = `${Math.round(percentage)}%`);
        } else {
          preview.current.style.opacity = "0";
        }
      };
      document.body.addEventListener("pointermove", tracker);
      return () => {
        document.body.removeEventListener("pointermove", tracker);
      };
    }, [area, preview, _preview]);

    return (
      <div className={`relative ${className}`}>
        {_preview && (
          <div
            ref={area}
            className={`pointer-events-none absolute inset-0 ${
              orientation === "horizontal" ? "h-10" : "w-10"
            }`}
          ></div>
        )}
        <RadixSlider.Root
          ref={forwardRef}
          className={`group relative flex ${
            orientation === "horizontal"
              ? "h-10 w-full flex-row"
              : "h-full w-10 flex-col"
          } cursor-pointer touch-none select-none items-center ${className}`}
          orientation={orientation}
          {...props}
        >
          <RadixSlider.Track
            className={`relative ${
              orientation === "horizontal" ? "h-2" : "w-2"
            } grow rounded-full border border-gray-800 bg-black`}
          >
            <RadixSlider.Range
              className={`absolute inset-0 z-[2] ${
                orientation === "horizontal"
                  ? "my-auto h-full group-hover:py-1"
                  : "mx-auto w-full group-hover:px-1"
              } rounded-full bg-white transition-colors-padding delay-100 duration-300 ease-in-out group-active:bg-orange-300`}
            />
            {_preview && !props.disabled && (
              <div
                ref={preview}
                className={`absolute z-[1] ${
                  orientation === "horizontal"
                    ? "h-full w-[0%]"
                    : "h-[0%] w-full"
                } rounded-full bg-gray-800 transition-size-opacity duration-[0] ease-linear group-active:hidden`}
              ></div>
            )}
          </RadixSlider.Track>
        </RadixSlider.Root>
      </div>
    );
  }
);
