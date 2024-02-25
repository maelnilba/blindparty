import { List } from "@components/elements/list";

const App = () => {
  return (
    <div className="h-80 p-2">
      <List.Root>
        {Array(50)
          .fill(0)
          .map((_, i) => (
            <List.Item
              className="flex gap-4 p-4 outline-blue-600 focus:outline"
              key={i}
            >
              {({ selected }) => (
                <>
                  <button
                    tabIndex={selected ? 0 : -1}
                    className="w-full cursor-pointer rounded bg-white px-2 text-center text-black"
                  >
                    {i}
                  </button>
                  <button
                    tabIndex={selected ? 0 : -1}
                    className="w-full cursor-pointer rounded bg-white px-2 text-center text-black"
                  >
                    {i}
                  </button>
                </>
              )}
            </List.Item>
          ))}
      </List.Root>
      <button tabIndex={0} className="focus:outline">
        test focus
      </button>
    </div>
  );
};

export default App;
