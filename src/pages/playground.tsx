import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4 px-20">
      <img width={300} height={300} src="/api/og/referrer" />
    </div>
  );
};

export default Playground;
