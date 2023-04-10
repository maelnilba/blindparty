import {
  useWindowConfirmation,
  useWindowConfirmationStore,
} from "@hooks/next/useWindowConfirmation";
import { useEffect } from "react";

type InterceptProps = {
  confirmText: string;
  subscribeOnMount?: boolean;
};
export const Intercept = ({
  confirmText,
  subscribeOnMount = true,
}: InterceptProps) => {
  const sub = useWindowConfirmationStore((state) => state.subscribe);
  const unsub = useWindowConfirmationStore((state) => state.unsubscribe);

  useEffect(() => {
    if (subscribeOnMount) sub();
    return () => unsub();
  }, [subscribeOnMount]);
  const windowConfirm = useWindowConfirmation(confirmText, true);

  return windowConfirm;
};
