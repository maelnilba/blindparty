import { ExclamationIcon } from "@components/icons/exclamation";
import type { z } from "zod";

type ErrorMessagesProps = {
  errors: z.ZodIssue[] | undefined;
};
export const ErrorMessages = ({ errors }: ErrorMessagesProps) => (
  <>
    {(errors ?? []).map((error, index) => (
      <div
        key={index}
        className="mx-auto flex select-none flex-row gap-2 text-center text-red-500"
      >
        <ExclamationIcon className="h-4 w-4" />
        <span className="text-xs font-normal">{error.message}</span>
      </div>
    ))}
  </>
);
