export function getQuery<T extends string | string[] | undefined>(
  query: T
): string | undefined {
  return query && typeof query === "string"
    ? query
    : query && Array.isArray(query)
    ? typeof query[0] === "string"
      ? query[0]
      : undefined
    : undefined;
}

interface UserAgent {
  isBot: boolean;
  ua: string;
  browser: {
    name?: string;
    version?: string;
  };
  device: {
    model?: string;
    type?: string;
    vendor?: string;
  };
  engine: {
    name?: string;
    version?: string;
  };
  os: {
    name?: string;
    version?: string;
  };
  cpu: {
    architecture?: string;
  };
}

export const getUA = (userAgent: UserAgent) => {
  const isAndroid = () => Boolean(userAgent.ua.match(/Android/i));
  const isIos = () => Boolean(userAgent.ua.match(/iPhone|iPad|iPod/i));
  const isOpera = () => Boolean(userAgent.ua.match(/Opera Mini/i));
  const isWindows = () => Boolean(userAgent.ua.match(/IEMobile/i));
  const isSSR = () => Boolean(userAgent.ua.match(/SSR/i));
  const isMobile = () =>
    Boolean(isAndroid() || isIos() || isOpera() || isWindows());
  const isDesktop = () => Boolean(!isMobile() && !isSSR());

  return {
    isMobile,
    isDesktop,
    isAndroid,
    isIos,
    isSSR,
  };
};
