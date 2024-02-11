import AnonSessionProvider from "@components/providers/anon";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <AnonSessionProvider>
      <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4">
        <div className="h-full"></div>
      </div>
    </AnonSessionProvider>
  );
};

export default Playground;
