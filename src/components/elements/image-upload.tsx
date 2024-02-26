import { Picture } from "@components/images/picture";
import type { S3Prefix } from "@server/api/routers/infra/s3";
import { validator } from "@shared/validators/presigned";
import { api } from "@utils/api";
import type { PresignedPost } from "aws-sdk/clients/s3";
import { noop } from "helpers/noop";
import {
  Children,
  ComponentProps,
  ReactElement,
  createContext,
  isValidElement,
  useContext,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";

const Context = createContext<{
  src: string | undefined;
  setSrc: (src: string | undefined) => void;
}>({ src: undefined, setSrc: noop });

export const ImageUpload = () => <></>;

type ImageUploadProps = ComponentProps<"div">;
ImageUpload.Root = ({ children, className, ...props }: ImageUploadProps) => {
  const [src, setSrc] = useState<string | undefined>();

  const input = Children.map(children, (child) =>
    isValidElement(child) && child.type === ImageUpload.Input ? child : false
  );

  const picture = Children.map(children, (child) =>
    isValidElement(child) && child.type === ImageUpload.Picture ? child : false
  );

  return (
    <Context.Provider value={{ src, setSrc }}>
      <div {...props} className={twMerge(className, "relative")}>
        {input}
        {picture}
      </div>
    </Context.Provider>
  );
};

type ImageUploadInputProps = Omit<ComponentProps<"input">, "type">;
ImageUpload.Input = ({
  className,
  onChange,
  ...props
}: ImageUploadInputProps) => {
  const { setSrc } = useContext(Context);
  return (
    <input
      className={twMerge(
        "absolute inset-0 h-full w-full cursor-pointer opacity-0",
        className
      )}
      type="file"
      onChange={(event) => {
        if (event.target.files && event.target.files.item(0))
          setSrc(URL.createObjectURL(event.target.files.item(0)!));
        onChange?.(event);
      }}
      {...props}
    />
  );
};

type ImageUploadPictureProps = Omit<
  ComponentProps<typeof Picture>,
  "children"
> & {
  children: (src: {
    src: string | undefined;
  }) => ReactElement<{ [key: string]: any; className: string }>;
};
ImageUpload.Picture = ({
  children,
  identifier,
  ...props
}: ImageUploadPictureProps) => {
  const { src } = useContext(Context);
  return (
    <Picture identifier={src ?? identifier} {...props}>
      {children({ src })}
    </Picture>
  );
};

export function useS3(opts: { prefix: S3Prefix }) {
  const { mutateAsync } = api.s3.delete.useMutation();

  const post = async (post: PresignedPost, file: File, key?: string | null) => {
    if (key) {
      await mutateAsync({ key: key, prefix: opts.prefix });
    }

    const formData = new FormData();
    Object.entries({
      ...post.fields,
      file,
    }).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return fetch(post.url, {
      method: "POST",
      body: formData,
    });
  };

  return {
    post,
  };
}

export const fetchPresignedPost =
  ({ prefix }: { prefix: S3Prefix }) =>
  async (blob: Blob | undefined) => {
    if (!blob) return null;
    const url = validator.createSearchURL({ prefix });
    const res = await fetch("/api/s3/presigned" + url);
    const data = await res.json();
    return { ...data, file: blob } as {
      post: PresignedPost;
      key: string;
      file: Blob;
    };
  };
