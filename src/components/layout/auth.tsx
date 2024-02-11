import { Noop } from "helpers/noop";
import { type NextPageWithAuth } from "next";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { PropsWithChildren } from "react";

export const Auth = ({
  children,
  auth,
}: PropsWithChildren<{ auth?: NextPageWithAuth["auth"] }>) => {
  if (!auth) return <Noop />;

  if (!(auth instanceof Function)) {
    return <AuthObjectRedirect auth={auth}>{children}</AuthObjectRedirect>;
  } else {
    return <AuthFunctionRedirect auth={auth}>{children}</AuthFunctionRedirect>;
  }
};

type TakeObject<TWhere> = TWhere extends infer U
  ? U extends (...args: any) => any
    ? never
    : U
  : never;

const AuthObjectRedirect = ({
  children,
  auth,
}: PropsWithChildren<{
  auth: NonNullable<TakeObject<NextPageWithAuth["auth"]>>;
}>) => {
  const { push, pathname } = useRouter();
  const { status, data: session } = useSession({ required: !!auth?.role });
  const redirect = () => {
    if (auth.redirect === "/sign-in")
      push({ pathname: auth.redirect, query: { redirect_to: pathname } });
    else push({ pathname: auth.redirect });
  };

  if (status === "loading") return <Noop />;
  if (status === "unauthenticated") {
    redirect();
    return <Noop />;
  }
  if (!session) {
    redirect();
    return <Noop />;
  }
  if (!session?.user) {
    redirect();
    return <Noop />;
  }
  if (auth.role && !auth.role.includes(session!.user!.role)) {
    redirect();
    return <Noop />;
  }
  return <>{children}</>;
};

type TakeFunction<TWhere> = TWhere extends infer U
  ? U extends (...args: any) => any
    ? U
    : never
  : never;

const AuthFunctionRedirect = ({
  children,
  auth: useAuth,
}: PropsWithChildren<{
  auth: NonNullable<TakeFunction<NextPageWithAuth["auth"]>>;
}>) => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { auth, isLoading, redirect: to } = useAuth(session);

  const redirect = () => {
    if (to === "/sign-in")
      router.push({ pathname: to, query: { redirect_to: router.pathname } });
    else router.push({ pathname: to });
  };
  if (isLoading) return <Noop />;

  if (status === "loading") return <Noop />;

  if (!auth) {
    redirect();
    return <Noop />;
  }
  return <>{children}</>;
};

export const AuthGuardAdmin: NonNullable<NextPageWithAuth["auth"]> = {
  role: ["ADMIN"],
  redirect: "/dashboard",
};

export const AuthGuardUser: NonNullable<NextPageWithAuth["auth"]> = (
  session
) => ({
  auth: Boolean(
    session && session.user && session.user.role && session.user.role !== "ANON"
  ),
  redirect: "/sign-in",
});

export const AuthGuard: NonNullable<NextPageWithAuth["auth"]> = {
  redirect: "/sign-in",
};
