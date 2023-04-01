import { Slider } from "@components/elements/slider";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4 px-20">
      <Slider preview />
    </div>
  );
};

export default Playground;
