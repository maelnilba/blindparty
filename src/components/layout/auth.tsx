import { type NextPageWithAuth } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { PropsWithChildren } from "react";

export const Auth = ({
  children,
  auth,
}: PropsWithChildren<{ auth?: NextPageWithAuth["auth"] }>) => {
  const { push, pathname, ...r } = useRouter();
  const { status, data: session } = useSession({ required: !!auth?.role });
  if (!auth) return <></>;
  const redirect = () => {
    if (auth.redirect === "/sign-in")
      push({ pathname: auth.redirect, query: { redirect_to: pathname } });
    else push({ pathname: auth.redirect });
  };
  if (status === "loading") return <></>;
  if (status === "unauthenticated") {
    redirect();
    return <></>;
  }
  if (!session) {
    redirect();
    return <></>;
  }
  if (!session?.user) {
    redirect();
    return <></>;
  }
  if (auth.role && !auth.role.includes(session!.user!.role)) {
    redirect();
    return <></>;
  }
  return <>{children}</>;
};

export const AuthGuardAdmin: NonNullable<NextPageWithAuth["auth"]> = {
  role: ["ADMIN"],
  redirect: "/dashboard",
};

export const AuthGuard: NonNullable<NextPageWithAuth["auth"]> = {
  redirect: "/sign-in",
};
