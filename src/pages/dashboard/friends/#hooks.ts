import { TRPCClientError } from "@trpc/client";
import { api } from "@utils/api";
import { useReducer } from "react";

type Id = {
  [key: string]: any;
  id: string;
};

type Action<T extends Id> = {
  type: "ACCEPT" | "REJECT" | "BLOCK" | "REFRESH";
  id: T["id"];
  cb?: Function;
};

export function useInvitation<T extends Id>(cb?: Function) {
  const { mutate: accept } = api.friend.accept_invitation.useMutation();

  const { mutate: refresh } = api.friend.refresh_invitation.useMutation();

  const { mutate: reject } = api.friend.reject_invitation.useMutation();

  const { mutate: block } = api.friend.block_invitation.useMutation();

  const doCb = (action: Action<T>) => {
    if (cb) {
      cb();
    }
    if (action.cb) {
      action.cb();
    }
  };
  const reducer = (_: any, action: Action<T>) => {
    switch (action.type) {
      case "ACCEPT":
        accept(
          { id: action.id },
          {
            onSuccess: () => doCb(action),
          }
        );
        break;
      case "BLOCK":
        block(
          { id: action.id },
          {
            onSuccess: () => doCb(action),
          }
        );
        break;
      case "REFRESH":
        refresh(
          { id: action.id },
          {
            onSuccess: () => doCb(action),
          }
        );
        break;
      case "REJECT":
        reject(
          { id: action.id },
          {
            onSuccess: () => doCb(action),
          }
        );
        break;
      default:
        break;
    }
  };
  const [_, dispatch] = useReducer(reducer, undefined);

  return dispatch;
}
