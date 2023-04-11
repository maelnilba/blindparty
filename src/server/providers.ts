/**
 * Custom Deezer provider
 * @see https://developers.deezer.com/api/oauth
 * @see https://developers.deezer.com/api/user
 */

import { OAuthUserConfig, OAuthConfig } from "next-auth/providers";

type DeezerProfil = {
  id: number;
  name: string;
  email: string | null | undefined;
  picture: string;
};

export const DeezerProvider = (
  options: OAuthUserConfig<DeezerProfil>
): OAuthConfig<DeezerProfil> => {
  return {
    id: "deezer",
    name: "Deezer",
    type: "oauth",
    authorization: {
      url: "https://connect.deezer.com/oauth/auth.php",
      params: {
        perms: "basic_access,email",
        scope: "basic_access,email",
      },
    },
    token: {
      async request({ provider, params }) {
        return new Promise(async (resolve, reject) => {
          try {
            const response = await fetch(
              `https://connect.deezer.com/oauth/access_token.php?${new URLSearchParams(
                {
                  app_id: provider.clientId!,
                  secret: provider.clientSecret!,
                  code: params.code!,
                }
              )}`
            );
            const data = new URLSearchParams(await response.text());
            resolve({
              tokens: {
                access_token: data.get("access_token") ?? undefined,
                expires_at: Math.ceil(
                  Date.now() / 1000 + +data.get("expires")!
                ),
              },
            });
          } catch (error) {
            reject(error);
          }
        });
      },
    },
    userinfo: {
      url: "https://api.deezer.com/user/me",
      request({ tokens, client }) {
        const { access_token } = tokens;
        return client.userinfo(access_token!, { params: { access_token } });
      },
    },
    // @ts-expect-error
    profile(profile) {
      return {
        id: "" + profile.id,
        name: profile.name,
        image: profile.picture,
        email: profile.email,
      };
    },
    options,
  };
};
