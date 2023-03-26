import { Square } from "@components/elements/square-loader";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <div className="scrollbar-hide flex flex-1 justify-center gap-4">
      <Square className="h-80 w-80 rounded border border-gray-800" active>
        <Square.Child>
          <p className="text-4xl font-extrabold">10</p>
        </Square.Child>
        <Square.Dash className="stroke-white stroke-[6]" />
      </Square>
    </div>
  );
};

export default Playground;
