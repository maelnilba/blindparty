import { ImageIcon } from "@components/icons/image";
import { Picture } from "@components/images/picture";
import { useS3 } from "@hooks/useS3";
import { api } from "@utils/api";
import { PresignedPost } from "aws-sdk/clients/s3";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { S3Prefix } from "server/api/routers/infra/s3";
export type ImageUploadRef = {
  upload: (key?: string) => Promise<Response>;
  key: string | undefined;
  changed: boolean;
};

type ImageUploadProps = {
  className?: string;
  src?: string | null;
  prefix: S3Prefix;
  presignedOptions?: {
    expires?: number;
    maxSize?: number;
  };
};
export const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(
  ({ className, src: _src, prefix, presignedOptions }, ref) => {
    const { mutateAsync } = api.s3.presigned.useMutation();
    const { post } = useS3({ prefix });
    const [__src, set__Src] = useState<string | null | undefined>(_src);
    const [file, setFile] = useState<File | null>(null);
    const [presigned, setPresigned] = useState<PresignedPost | undefined>();
    const [key, setKey] = useState<string | undefined>();
    const src = __src ? __src : _src;

    useImperativeHandle(
      ref,
      () => ({
        upload: async (_key?: string) => {
          if (!presigned || !file)
            throw new Error("No file present or presigned url failed");
          return await post(presigned, file, _key);
        },
        key: key,
        changed: Boolean(file && key && presigned),
      }),
      [presigned, key, file]
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
            setFile(file);
            e.target.value = "";

            const url = URL.createObjectURL(file);
            set__Src(url);

            const { key, post } = await mutateAsync({
              expires: presignedOptions?.expires,
              maxSize: presignedOptions?.maxSize,
              prefix: prefix,
            });
            setPresigned(post);
            setKey(key);
          }}
          type="file"
          accept="image/*"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />

        {src ? (
          <Picture identifier={src}>
            <img src={src} className="aspect-square object-cover" />
          </Picture>
        ) : (
          <ImageIcon className="pointer-events-none h-12 w-12 group-hover:scale-105" />
        )}
      </div>
    );
  }
);
