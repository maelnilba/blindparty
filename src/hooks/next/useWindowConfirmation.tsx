import {
  ConfirmationModal,
  ModalRef,
} from "@components/elements/confirmation-modal";
import { noop } from "helpers/noop";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";
import { create } from "zustand";

export const useWindowConfirmationStore = create<{
  active: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}>((set) => ({
  active: false,
  subscribe: () => set({ active: true }),
  unsubscribe: () => set({ active: false }),
}));

export function useWindowConfirmation(
  warning: string,
  isSubscribe: boolean | null | undefined = false
) {
  const router = useRouter();
  const modal = useRef<ModalRef>(null);
  const path = useRef<{ url: string; options: { shallow: boolean } }>();
  const success = useRef(false);
  const active = useWindowConfirmationStore((state) => state.active);

  useEffect(() => {
    if (!isSubscribe) return noop;
    if (!active) return noop;
    const handleBrowseAway = (url: string, options: { shallow: boolean }) => {
      if (success.current) return true;

      path.current = { url, options };

      if (modal.current) modal.current.open();
      router.events.emit("routeChangeError");
      throw "routeChange aborted.";
    };

    router.events.on("routeChangeStart", handleBrowseAway);
    return () => {
      router.events.off("routeChangeStart", handleBrowseAway);
    };
  }, [isSubscribe, active]);

  return (
    <ConfirmationModal.Root ref={modal}>
      <ConfirmationModal.Title>Quitter la page</ConfirmationModal.Title>
      <ConfirmationModal.Message>{warning}</ConfirmationModal.Message>
      <ConfirmationModal.Action className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105">
        Annuler
      </ConfirmationModal.Action>
      <ConfirmationModal.Action
        className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
        onClick={() => {
          if (!path.current) return;
          success.current = true;
          router.push(path.current.url, undefined, path.current.options);
        }}
      >
        Quitter
      </ConfirmationModal.Action>
    </ConfirmationModal.Root>
  );
}
