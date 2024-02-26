import { useForm } from "@marienilba/react-zod-form";
import { z } from "zod";

const schema = z.object({
  test: z.coerce.string(),
});

const App = () => {
  const form = useForm(schema, async (event) => {
    event.preventDefault();

    if (!event.success) return;
    console.log(event.data);
  });
  return (
    <form onSubmit={form.form.submit} className="h-80 p-2">
      <input
        className="text-black"
        name={form.fields.test().name()}
        value={undefined}
        type="hidden"
      />

      <button type="submit">submit</button>
    </form>
  );
};

export default App;
