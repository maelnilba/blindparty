import { fetchPresignedPost, useS3 } from "@components/elements/image-upload";
import { useSubmit } from "@hooks/form/useSubmit";
import { api } from "@utils/api";
import { zu } from "@utils/zod";
import { useRouter } from "next/router";
import { z } from "zod";
import { useMergeAlbum } from "./albums-picture";
import { PlaylistPrisma, Track } from "./types";

export const editSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tracks: z
    .array(z.object({ id: z.string() }))
    .min(1, { message: "Une playlist doit contenir au minimum une track." })
    .max(1000, {
      message: "Une playlist ne peut contenir plus de 1000 tracks.",
    })
    .default([]),
  image: zu
    .file({
      name: z.string(),
      size: z.number().max(5, { message: "The file should be lower than 5Mo" }),
      type: z.string().startsWith("image/"),
    })
    .optional()
    .transform(fetchPresignedPost({ prefix: "playlist" })),
});

export const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tracks: z
    .array(z.object({ id: z.string() }))
    .min(1, { message: "Une playlist doit contenir au minimum une track." })
    .max(1000, {
      message: "Une playlist ne peut contenir plus de 1000 tracks.",
    })
    .default([]),
  image: zu
    .file({
      name: z.string(),
      size: z.number().max(5, { message: "The file should be lower than 5Mo" }),
      type: z.string().startsWith("image/"),
    })
    .optional()
    .transform(fetchPresignedPost({ prefix: "playlist" })),
});

type EditArgs = {
  id: string | undefined;
  playlist: PlaylistPrisma | undefined;
  tracksMap: Map<Track["id"], Track>;
  mockAlbum: ReturnType<typeof useMergeAlbum>["0"];
  fetchMockAlbum: ReturnType<typeof useMergeAlbum>["1"];
};

export const useEdit = ({
  id,
  playlist,
  tracksMap,
  mockAlbum,
  fetchMockAlbum,
}: EditArgs) => {
  const { post } = useS3({ prefix: "playlist" });
  const { push } = useRouter();

  const utils = api.useContext();

  const {
    mutateAsync: edit,
    isLoading: isEditLoading,
    isSuccess: isEditSuccess,
  } = api.playlist.edit.useMutation({
    onSuccess: () => {
      push("/dashboard/playlist");
    },
  });

  const {
    mutateAsync: edit_empty,
    isLoading: isEditEmptyLoading,
    isSuccess: isEditEmptySuccess,
  } = api.playlist.edit_empty.useMutation();

  const {
    mutateAsync: remove_tracks,
    isLoading: isRemoveTracksLoading,
    isSuccess: isRemoveTrackSuccess,
  } = api.playlist.remove_tracks.useMutation();

  const {
    mutateAsync: insert_tracks,
    isLoading: isInsertTracksLoading,
    isSuccess: isInsertTrackSuccess,
  } = api.playlist.insert_tracks.useMutation();

  const submit = useSubmit<typeof editSchema>(async (e) => {
    if (!e.success) return;
    if (!id || !playlist) {
      return;
    }
    const removed_tracks = playlist.tracks
      .filter((track) => !tracksMap.has(track.id))
      .map((track) => track.id);

    const tracks = [...tracksMap]
      .map(([_, track]) => ({
        id: track.id,
        name: track.name,
        previewUrl: track.previewUrl!,
        album: {
          name: track.album.name,
          images: track.album.images.map((image) => ({
            url: image.url,
          })),
        },
        artists: track.artists.map((artist) => ({
          name: artist.name,
        })),
      }))
      .filter((t) => !playlist.tracks.find((pt) => pt.id === t.id));

    let key = playlist.s3Key!;
    if (e.data.image) {
      await post(
        e.data.image.post,
        new File([e.data.image.file], e.data.image.file.name)
      );
      key = e.data.image.key;
    } else if (mockAlbum && playlist.generated) {
      const mock = await fetchMockAlbum(mockAlbum);
      const presigned = (await fetchPresignedPost({
        prefix: "playlist",
      })(mock))!;
      await post(
        presigned.post,
        new File([presigned.file], presigned.file.name)
      );
      key = presigned.key;
    }

    if (tracks.length <= 20) {
      await edit({
        id: id,
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        tracks: tracks,
        removed_tracks: removed_tracks,
        generated: !Boolean(e.data.image) && playlist.generated,
      });
    } else {
      const edit = await edit_empty({
        id: playlist.id,
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        generated: !Boolean(e.data.image) && playlist.generated,
      });

      await Promise.all(
        Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
          tracks.slice(i * 20, i * 20 + 20)
        )
          .map((tracks) => insert_tracks({ id: edit.id, tracks }))
          .concat([remove_tracks({ id: edit.id, removed_tracks })])
      );

      utils.playlist.get_playlist.invalidate({ id: id! });
      push("/dashboard/playlist");
    }
  });

  const isLoading =
    isEditLoading ||
    isEditEmptyLoading ||
    isInsertTracksLoading ||
    isRemoveTracksLoading;
  const isSuccess =
    isEditSuccess ||
    isEditEmptySuccess ||
    isInsertTrackSuccess ||
    isRemoveTrackSuccess;
  return { ...submit, isLoading, isSuccess };
};

export const useAdminEdit = ({
  id,
  playlist,
  tracksMap,
  mockAlbum,
  fetchMockAlbum,
}: EditArgs) => {
  const { post } = useS3({ prefix: "playlist" });
  const { push } = useRouter();

  const utils = api.useContext();

  const {
    mutateAsync: edit,
    isLoading: isEditLoading,
    isSuccess: isEditSuccess,
  } = api.admin.playlist.edit.useMutation({
    onSuccess: () => {
      push("/dashboard/playlist");
    },
  });

  const {
    mutateAsync: edit_empty,
    isLoading: isEditEmptyLoading,
    isSuccess: isEditEmptySuccess,
  } = api.admin.playlist.edit_empty.useMutation();

  const {
    mutateAsync: remove_tracks,
    isLoading: isRemoveTracksLoading,
    isSuccess: isRemoveTrackSuccess,
  } = api.admin.playlist.remove_tracks.useMutation();

  const {
    mutateAsync: insert_tracks,
    isLoading: isInsertTracksLoading,
    isSuccess: isInsertTrackSuccess,
  } = api.admin.playlist.insert_tracks.useMutation();

  const submit = useSubmit<typeof editSchema>(async (e) => {
    if (!e.success) return;
    if (!id || !playlist) {
      return;
    }
    const removed_tracks = playlist.tracks
      .filter((track) => !tracksMap.has(track.id))
      .map((track) => track.id);

    const tracks = [...tracksMap]
      .map(([_, track]) => ({
        id: track.id,
        name: track.name,
        previewUrl: track.previewUrl!,
        album: {
          name: track.album.name,
          images: track.album.images.map((image) => ({
            url: image.url,
          })),
        },
        artists: track.artists.map((artist) => ({
          name: artist.name,
        })),
      }))
      .filter((t) => !playlist.tracks.find((pt) => pt.id === t.id));

    let key = playlist.s3Key!;
    if (e.data.image) {
      await post(
        e.data.image.post,
        new File([e.data.image.file], e.data.image.file.name)
      );
      key = e.data.image.key;
    } else if (mockAlbum && playlist.generated) {
      const mock = await fetchMockAlbum(mockAlbum);
      const presigned = (await fetchPresignedPost({
        prefix: "playlist",
      })(mock))!;
      await post(
        presigned.post,
        new File([presigned.file], presigned.file.name)
      );
      key = presigned.key;
    }

    if (tracks.length <= 20) {
      await edit({
        id: id,
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        tracks: tracks,
        removed_tracks: removed_tracks,
        generated: !Boolean(e.data.image) && playlist.generated,
      });
    } else {
      const edit = await edit_empty({
        id: playlist.id,
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        generated: !Boolean(e.data.image) && playlist.generated,
      });

      await Promise.all(
        Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
          tracks.slice(i * 20, i * 20 + 20)
        )
          .map((tracks) => insert_tracks({ id: edit.id, tracks }))
          .concat([remove_tracks({ id: edit.id, removed_tracks })])
      );

      utils.admin.playlist.get_playlist.invalidate({ id: id! });
      push("/admin/playlist");
    }
  });

  const isLoading =
    isEditLoading ||
    isEditEmptyLoading ||
    isInsertTracksLoading ||
    isRemoveTracksLoading;
  const isSuccess =
    isEditSuccess ||
    isEditEmptySuccess ||
    isInsertTrackSuccess ||
    isRemoveTrackSuccess;
  return { ...submit, isLoading, isSuccess };
};

type CreateArgs = {
  tracksMap: Map<Track["id"], Track>;
  mockAlbum: ReturnType<typeof useMergeAlbum>["0"];
  fetchMockAlbum: ReturnType<typeof useMergeAlbum>["1"];
};

export const useCreate = ({
  tracksMap,
  mockAlbum,
  fetchMockAlbum,
}: CreateArgs) => {
  const { post } = useS3({ prefix: "playlist" });
  const { push } = useRouter();

  const {
    mutateAsync: create,
    isLoading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = api.playlist.create.useMutation({
    onSuccess: () => {
      push("/dashboard/playlist");
    },
  });

  const {
    mutateAsync: create_empty,
    isLoading: isCreateEmptyLoading,
    isSuccess: isCreateEmptySuccess,
  } = api.playlist.create_empty.useMutation();

  const {
    mutateAsync: insert_tracks,
    isLoading: isInsertTracksLoading,
    isSuccess: isInsertTrackSuccess,
  } = api.playlist.insert_tracks.useMutation();

  const submit = useSubmit<typeof createSchema>(async (e) => {
    if (!e.success) return;

    const tracks = [...tracksMap].map(([_, track]) => ({
      id: track.id,
      name: track.name,
      previewUrl: track.previewUrl!,
      album: {
        name: track.album.name,
        images: track.album.images.map((image) => ({
          url: image.url,
        })),
      },
      artists: track.artists.map((artist) => ({
        name: artist.name,
      })),
    }));

    let key: string | never = z.NEVER;
    if (e.data.image) {
      await post(
        e.data.image.post,
        new File([e.data.image.file], e.data.image.file.name)
      );
      key = e.data.image.key;
    } else if (mockAlbum) {
      const mock = await fetchMockAlbum(mockAlbum);
      const presigned = (await fetchPresignedPost({
        prefix: "playlist",
      })(mock))!;
      await post(
        presigned.post,
        new File([presigned.file], presigned.file.name)
      );
      key = presigned.key;
    }

    if (tracks.length <= 20) {
      await create({
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        tracks: tracks,
        generated: !Boolean(e.data.image),
      });
    } else {
      const playlist = await create_empty({
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        generated: !Boolean(e.data.image),
      });

      await Promise.all(
        Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
          tracks.slice(i * 20, i * 20 + 20)
        ).map((tracks) => insert_tracks({ id: playlist.id, tracks }))
      );

      push("/dashboard/playlist");
    }
  });

  const isLoading =
    isCreateLoading || isCreateEmptyLoading || isInsertTracksLoading;
  const isSuccess =
    isCreateSuccess || isCreateEmptySuccess || isInsertTrackSuccess;
  return { ...submit, isLoading, isSuccess };
};

export const useAdminCreate = ({
  tracksMap,
  mockAlbum,
  fetchMockAlbum,
}: CreateArgs) => {
  const { post } = useS3({ prefix: "playlist" });
  const { push } = useRouter();

  const {
    mutateAsync: create,
    isLoading: isCreateLoading,
    isSuccess: isCreateSuccess,
  } = api.admin.playlist.create.useMutation({
    onSuccess: () => {
      push("/dashboard/playlist");
    },
  });

  const {
    mutateAsync: create_empty,
    isLoading: isCreateEmptyLoading,
    isSuccess: isCreateEmptySuccess,
  } = api.admin.playlist.create_empty.useMutation();

  const {
    mutateAsync: insert_tracks,
    isLoading: isInsertTracksLoading,
    isSuccess: isInsertTrackSuccess,
  } = api.admin.playlist.insert_tracks.useMutation();

  const submit = useSubmit<typeof createSchema>(async (e) => {
    if (!e.success) return;

    const tracks = [...tracksMap].map(([_, track]) => ({
      id: track.id,
      name: track.name,
      previewUrl: track.previewUrl!,
      album: {
        name: track.album.name,
        images: track.album.images.map((image) => ({
          url: image.url,
        })),
      },
      artists: track.artists.map((artist) => ({
        name: artist.name,
      })),
    }));

    let key: string | never = z.NEVER;
    if (e.data.image) {
      await post(
        e.data.image.post,
        new File([e.data.image.file], e.data.image.file.name)
      );
      key = e.data.image.key;
    } else if (mockAlbum) {
      const mock = await fetchMockAlbum(mockAlbum);
      const presigned = (await fetchPresignedPost({
        prefix: "playlist",
      })(mock))!;
      await post(
        presigned.post,
        new File([presigned.file], presigned.file.name)
      );
      key = presigned.key;
    }

    if (tracks.length <= 20) {
      await create({
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        tracks: tracks,
        generated: !Boolean(e.data.image),
      });
    } else {
      const playlist = await create_empty({
        name: e.data.name,
        description: e.data.description,
        s3Key: key,
        generated: !Boolean(e.data.image),
      });

      await Promise.all(
        Array.from({ length: Math.ceil(tracks.length / 20) }, (_, i) =>
          tracks.slice(i * 20, i * 20 + 20)
        ).map((tracks) => insert_tracks({ id: playlist.id, tracks }))
      );

      push("/admin/playlist");
    }
  });

  const isLoading =
    isCreateLoading || isCreateEmptyLoading || isInsertTracksLoading;
  const isSuccess =
    isCreateSuccess || isCreateEmptySuccess || isInsertTrackSuccess;
  return { ...submit, isLoading, isSuccess };
};
