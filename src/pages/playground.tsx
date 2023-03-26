import { InputSelect } from "@components/elements/input-select";
import { NextPageWithLayout } from "next";
import { useRef } from "react";

const Playground: NextPageWithLayout = () => {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="scrollbar-hide flex flex-1 justify-center gap-4">
      <div className="w-full max-w-lg">
        <InputSelect
          type="number"
          min="1"
          max="100"
          className={`block w-full rounded-lg border border-gray-800 bg-black p-2.5 text-sm text-white focus:border-gray-500 focus:outline-none focus:ring-gray-500`}
        >
          {Array(10)
            .fill(null)
            .map((_, idx) => (
              <option key={idx} value={(idx + 1) * 10}>
                {(idx + 1) * 10}
              </option>
            ))}
        </InputSelect>
      </div>
    </div>
  );
};

export default Playground;
