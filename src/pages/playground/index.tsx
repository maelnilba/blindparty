import * as Slider from "@radix-ui/react-slider";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

const App = () => {
  return (
    <div className="h-80">
      <Slider.Root
        defaultValue={[0]}
        className={twMerge(
          clsx(
            "group relative flex items-center active:cursor-pointer data-[orientation='horizontal']:h-10 data-[orientation='vertical']:h-full data-[orientation='horizontal']:w-full data-[orientation='vertical']:w-10 data-[orientation='horizontal']:flex-row data-[orientation='vertical']:flex-col"
          )
        )}
        step={1}
        orientation="horizontal"
        onValueChange={(value) => {}}
        onValueCommit={(value) => {}}
        onLostPointerCapture={() => {}}
      >
        <Slider.Track className="relative flex-grow rounded border border-gray-800 bg-black ring-1 ring-white/20 transition-all group-data-[orientation='horizontal']:h-2.5 group-data-[orientation='vertical']:w-2.5">
          <Slider.Range className="absolute z-20 rounded bg-white transition-all group-hover:bg-orange-500 group-focus:bg-orange-500 group-data-[orientation='horizontal']:h-full group-data-[orientation='vertical']:w-full" />
        </Slider.Track>
        <Slider.Thumb className="block h-0 w-0" aria-label="Volume" />
      </Slider.Root>
    </div>
  );
};

export default App;
