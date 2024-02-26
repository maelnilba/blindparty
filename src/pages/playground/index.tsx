import { useForm } from "@marienilba/react-zod-form";
import { validator } from "@shared/validators/presigned";
import { zu } from "@utils/zod";
import { PresignedPost } from "aws-sdk/clients/s3";
import { z } from "zod";

const schema = z.object({
  image: zu
    .file({
      name: z.string(),
      size: z.number().max(200),
      type: z.string().startsWith("image/"),
    })
    .optional()
    .transform(async (file) => {
      if (!file) return null;
      const url = validator.createSearchURL({ prefix: "playlist" });
      const res = await fetch("/api/s3/presigned" + url);
      const data = await res.json();
      return { ...data, file } as {
        post: PresignedPost;
        key: string;
        file: Blob;
      };
    }),
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
        onChange={(e) => {
          e.target.value = "";
        }}
        name={form.fields.image().name()}
        type="file"
      />
      <button type="submit">submit</button>
    </form>
  );
};

export default App;
