import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  const a = async () => {};
  return (
    <div className="scrollbar-hide flex flex-1 justify-center gap-4">
      <form onSubmit={(e) => a()}></form>
      <button onClick={() => {}} className="pt-24">
        Prout
      </button>
    </div>
  );
};

export default Playground;
