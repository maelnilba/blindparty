import { useRef, useState } from "react";
import { ValidSubmitEvent } from "react-zorm/dist/use-zorm";
import { z, ZodObject } from "zod";

export function useSubmit<TData extends ZodObject<any>>(
  func: (e: ValidSubmitEvent<z.infer<TData>>) => Promise<any>
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isError, setIsError] = useState(false);

  const submitting = useRef(false);
  const handleFunc = async (e: ValidSubmitEvent<any>) => {
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

  const handleFuncPreventDefault = async (e: ValidSubmitEvent<any>) => {
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
    submit: handleFunc as (e: ValidSubmitEvent<z.infer<TData>>) => Promise<any>,
    submitPreventDefault: handleFuncPreventDefault as (
      e: ValidSubmitEvent<z.infer<TData>>
    ) => Promise<any>,
    isSubmitting,
    isError,
  };
}
