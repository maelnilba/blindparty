import * as RadixSlider from "@radix-ui/react-slider";
import { forwardRef, useEffect, useRef } from "react";

export const Slider = forwardRef<
  HTMLSpanElement,
  RadixSlider.SliderProps & { preview?: boolean }
>(({ preview: _preview = false, className, ...props }, forwardRef) => {
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
        const percentage = ((mouseX - areaX) / areaWidth) * 100;
        preview.current.style.width = `${Math.round(percentage)}%`;
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
          className="pointer-events-none absolute inset-0 h-10"
        ></div>
      )}
      <RadixSlider.Root
        ref={forwardRef}
        className={`group relative flex h-10 w-full cursor-pointer touch-none select-none items-center ${className}`}
        {...props}
      >
        <RadixSlider.Track className="relative h-2 grow rounded-full border border-gray-800 bg-black">
          <RadixSlider.Range className="absolute inset-0 z-[2] my-auto h-full rounded-full bg-white transition-colors-padding delay-100 duration-300 ease-in-out group-hover:py-1 group-active:bg-orange-300" />
          {_preview && !props.disabled && (
            <div
              ref={preview}
              className="absolute z-[1] h-full w-[0%] rounded-full bg-gray-800 transition-width-opacity duration-[0] ease-linear group-active:hidden"
            ></div>
          )}
        </RadixSlider.Track>
        {/* <RadixSlider.Thumb className="block h-6 w-6 -translate-y-10 rounded bg-white opacity-0 outline-none">
        PROUT
      </RadixSlider.Thumb> */}
      </RadixSlider.Root>
    </div>
  );
});
