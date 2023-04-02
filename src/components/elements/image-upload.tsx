import { ImageIcon } from "@components/icons/image";
import { Picture } from "@components/images/picture";
import { useS3 } from "@hooks/useS3";
import type { S3Prefix } from "@server/api/routers/infra/s3";
import { api } from "@utils/api";
import { PresignedPost } from "aws-sdk/clients/s3";
import {
  forwardRef,
  ReactNode,
  useDeferredValue,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
export type ImageUploadRef = {
  set: (blob: Blob, upload: boolean, key?: string) => Promise<Response | void>;
  remove: () => void;
  upload: (key?: string) => Promise<Response>;
  key: string | undefined;
  changed: boolean;
  local: boolean;
};

type ImageUploadProps = {
  children?: ReactNode;
  className?: string;
  src?: string | null;
  generated?: boolean;
  prefix: S3Prefix;
  presignedOptions?: {
    /**
     * The expires time of the presigned url in seconds
     */
    expires?: number;
    maxSize?: number;
    autoResigne?: boolean;
  };
};
export const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(
  (
    {
      className,
      src: _src,
      prefix,
      presignedOptions,
      children,
      generated = false,
    },
    ref
  ) => {
    const { mutateAsync } = api.s3.presigned.useMutation();
    const { post } = useS3({ prefix });
    const [__src, set__Src] = useState<string | null | undefined>(_src);
    const [file, setFile] = useState<File | null>(null);
    const [presigned, setPresigned] = useState<PresignedPost | undefined>();
    const [key, setKey] = useState<string | undefined>();
    const [local, setLocal] = useState(false);
    const deferredSrc = useDeferredValue(__src);

    const expiresAt = useRef(
      new Date(Date.now() + (presignedOptions?.expires ?? 0) * 1000)
    );
    const isPresigned = useRef(false);

    const src = deferredSrc ? deferredSrc : _src;

    const getPresigned = async (check: boolean = true) => {
      if (
        check &&
        expiresAt.current.valueOf() > Date.now() &&
        isPresigned.current
      ) {
        return;
      }
      const { key: _key, post } = await mutateAsync({
        expires: presignedOptions?.expires,
        maxSize: presignedOptions?.maxSize,
        prefix: prefix,
      });

      setPresigned(post);
      setKey(_key);

      expiresAt.current = new Date(
        Date.now() + (presignedOptions?.expires ?? 0) * 1000
      );
      isPresigned.current = true;

      return { post, _key };
    };

    const set = async (file: File, upload: boolean = false) => {
      setFile(file);
      const url = URL.createObjectURL(file);
      set__Src(url);
      return await getPresigned(!upload);
    };

    useImperativeHandle(
      ref,
      () => ({
        set: async (blob: Blob, upload: boolean = false, _key?: string) => {
          const file = new File([blob], "albums_merged");
          const presign = await set(file, upload);
          if (upload && presign) {
            return await post(presign.post, file, _key);
          }
        },
        remove: () => {
          setFile(null);
          set__Src(_src);
          setPresigned(undefined);
          setKey(undefined);
          isPresigned.current = false;
        },
        upload: async (_key?: string) => {
          if (!presigned || !file)
            throw new Error("No file present or presigned url failed");
          if (expiresAt.current.valueOf() < Date.now()) {
            if (presignedOptions?.autoResigne) {
              await getPresigned();
            } else {
              throw new Error("The presigned url has expired");
            }
          }
          return await post(presigned, file, _key);
        },
        key: key,
        changed: Boolean(file && key && presigned && !local),
        local: local,
      }),
      [presigned, key, file, local]
    );

    return (
      <div
        className={`${
          className ?? ""
        } group relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded border border-gray-800 object-cover text-white`}
      >
        <input
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            set(file);
            e.target.value = "";
            setLocal(true);
          }}
          type="file"
          accept="image/*"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        {src ? (
          <img src={src} className="aspect-square object-cover" />
        ) : (
          <ImageIcon className="pointer-events-none h-12 w-12 group-hover:scale-105" />
        )}
        {children && (!generated ? !src : true) && (
          <div className="pointer-events-none absolute">{children}</div>
        )}
      </div>
    );
  }
);
