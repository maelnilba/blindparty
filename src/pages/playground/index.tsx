import { List } from "@components/elements/list";

const App = () => {
  return (
    <div className="h-80">
      <List.Root>
        {Array(50)
          .fill(0)
          .map((_, i) => (
            <li className="focus:bg-gray-800" key={i}>
              <button
                onClick={(e) => console.log(e)}
                className="cursor-pointer rounded bg-white px-2 text-center text-black"
              >
                {i}
              </button>
            </li>
          ))}
      </List.Root>
    </div>
  );
};

export default App;
