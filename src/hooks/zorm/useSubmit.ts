import { useRef, useState } from "react";
import { ZodSchema, z } from "zod";

export function useSubmit<TData extends ZodSchema>(
  func: (
    e: React.FormEvent<HTMLFormElement> &
      z.SafeParseReturnType<z.infer<TData>, z.infer<TData>>
  ) => Promise<any>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);

  const submitting = useRef(false);
  const handleFunc = async (
    e: React.FormEvent<HTMLFormElement> &
      z.SafeParseReturnType<z.infer<any>, z.infer<any>>
  ) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      setIsSubmitting(true);
      setIsError(false);
      await func(e);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsSubmitting(false);
      submitting.current = false;
    }
  };

  const handleFuncPreventDefault = async (
    e: React.FormEvent<HTMLFormElement> &
      z.SafeParseReturnType<z.infer<any>, z.infer<any>>
  ) => {
    if (submitting.current) return;
    submitting.current = true;
    try {
      setIsSubmitting(true);
      setIsError(false);
      e.preventDefault();
      await func(e);
    } catch (error) {
      setIsError(true);
    } finally {
      setIsSubmitting(false);
      submitting.current = false;
    }
  };

  return {
    submit: handleFunc as (
      e: React.FormEvent<HTMLFormElement> &
        z.SafeParseReturnType<z.infer<TData>, z.infer<TData>>
    ) => Promise<any>,
    submitPreventDefault: handleFuncPreventDefault as (
      e: React.FormEvent<HTMLFormElement> &
        z.SafeParseReturnType<z.infer<TData>, z.infer<TData>>
    ) => Promise<any>,
    isSubmitting,
    isError,
  };
}
