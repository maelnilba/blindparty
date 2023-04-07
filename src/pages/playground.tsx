import { Slider } from "@components/elements/slider";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4">
      <div className="h-full">
        <Slider
          orientation="vertical"
          inverted
          preview
          className="h-96 w-96"
          min={0}
          max={100}
        />
      </div>
    </div>
  );
};

export default Playground;
