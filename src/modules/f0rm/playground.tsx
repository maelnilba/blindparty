import { useRef } from "react";
import { z } from "zod";
import { useF0rm } from ".";

const schema = z.object({
  test: z.coerce.number().max(10).optional(),
  array: z.array(
    z.object({
      testoa: z.coerce.number(),
      darr: z.array(z.object({ huhu: z.coerce.string() })),
    })
  ),
  object: z.object({
    testobj: z.coerce.number(),
  }),
});

export default function Home() {
  const form = useRef<HTMLFormElement>(null);

  const f0rm = useF0rm(schema, (event) => {
    if (event.success) event.data;
    event.preventDefault();
    // valide
  });

  const test = f0rm.watch(form, f0rm.fields.object().name());

  const arr = f0rm.watch(form, f0rm.fields.array().name());

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-white">
      <p>VALUE: {test?.testobj} </p>
      <p>
        ERROR:
        {f0rm.errors
          .object()
          .errors()
          ?.map((e) => (
            <span key={e.code}>{e.message}</span>
          ))}
      </p>
      <p>VALUE: {JSON.stringify(arr)} </p>
      <p>
        ERROR:
        {f0rm.errors
          .array()
          .errors()
          ?.map((e) => (
            <span key={e.code}>{e.message}</span>
          ))}
      </p>
      <form ref={form} onSubmit={f0rm.form.submit}>
        <input
          type="number"
          name={f0rm.fields.test().name()}
          className="border border-slate-400 bg-slate-600 p-2 text-white"
          placeholder="test"
        />
        <input
          type="text"
          name={f0rm.fields.object().testobj().name()}
          className="border border-slate-400 bg-slate-600 p-2 text-white"
          placeholder="testobj"
        />
        {Array(5)
          .fill(null)
          .map((_, index) => {
            return (
              <div key={index}>
                {Array(5)
                  .fill(null)
                  .map((_, index2) => (
                    <input
                      key={index2}
                      type="text"
                      name={f0rm.fields.array(index).darr(index2).huhu().name()}
                      className="border border-slate-400 bg-slate-600 p-2 text-white"
                      placeholder="array darr huhu"
                    />
                  ))}
                <input
                  type="text"
                  name={f0rm.fields.array(index).testoa().name()}
                  className="border border-slate-400 bg-slate-600 p-2 text-white"
                  placeholder="array testoa"
                />
              </div>
            );
          })}
        <button
          className="cursor-pointer rounded bg-slate-900 px-2.5 py-1 text-white focus-within:bg-slate-800 hover:bg-slate-950"
          type="submit"
        >
          submit
        </button>
      </form>
    </main>
  );
}
