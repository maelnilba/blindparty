import {
  ConfirmationModal,
  ModalRef,
} from "@components/modals/confirmation-modal";
import { noop } from "@lib/helpers/noop";
import { useRouter } from "next/router";
import { useEffect, useRef } from "react";

export function useWindowConfirmation(
  warning: string,
  isSubscribe: boolean | null | undefined = false
) {
  const router = useRouter();
  const modal = useRef<ModalRef>(null);
  const path = useRef<{ url: string; options: { shallow: boolean } }>();
  const success = useRef(false);

  useEffect(() => {
    if (!isSubscribe) return noop;

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
  }, [isSubscribe]);

  return (
    <ConfirmationModal
      ref={modal}
      title="Quitter la page"
      message={warning}
      onSuccess={() => {
        if (!path.current) return;
        success.current = true;
        router.push(path.current.url, undefined, path.current.options);
      }}
      actions={["Annuler", "Quitter"]}
    ></ConfirmationModal>
  );
}
