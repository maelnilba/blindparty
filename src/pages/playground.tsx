import { SpeakerIcon } from "@components/icons/speaker";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4">
      <div className="h-full">
        <SpeakerIcon className="h-6 w-6 cursor-pointer transition-transform duration-75 hover:scale-105" />
      </div>
    </div>
  );
};

export default Playground;
