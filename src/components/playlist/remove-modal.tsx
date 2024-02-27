import { ModalRef } from "@components/elements/confirmation-modal";
import { Modal } from "@components/elements/modal";
import { forwardRef } from "react";
import { Track } from "./types";

type RemoveModalProps = {
  current: Track | undefined;
  remove: (track: Track) => void;
  reset: () => void;
};
export const RemoveModal = forwardRef<ModalRef, RemoveModalProps>(
  ({ current, remove, reset }, ref) => (
    <Modal.Root ref={ref} closeOnOutside={false}>
      <Modal.Title className="mb-2 inline-block w-full max-w-sm text-lg font-medium leading-6">
        Retirer tout
      </Modal.Title>
      <Modal.Content>
        <p>Souhaitez vous retirer toutes les tracks de la playlist ?</p>
        <div className="mt-4 flex flex-row justify-end gap-2">
          <Modal.Close
            type="button"
            className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            onClick={() => {
              if (current) remove(current);
            }}
          >
            Retirer
          </Modal.Close>
          <Modal.Close
            type="button"
            className="rounded-full bg-white px-6 py-1 text-center text-lg font-semibold text-black no-underline transition-transform hover:scale-105"
            onClick={reset}
          >
            Retirer tout
          </Modal.Close>
        </div>
      </Modal.Content>
    </Modal.Root>
  )
);
