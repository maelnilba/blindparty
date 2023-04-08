import { api } from "@utils/api";
import type { PresignedPost } from "aws-sdk/clients/s3";
import type { S3Prefix } from "@server/api/routers/infra/s3";

export function useS3(opts: { prefix: S3Prefix }) {
  const { mutateAsync } = api.s3.delete.useMutation();
  const post = async (post: PresignedPost, file: File, key?: string) => {
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
