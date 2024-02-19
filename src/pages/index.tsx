import { Square } from "@components/elements/square-loader";
import { SpotifyIcon } from "@components/icons/socials/spotify";
import { Picture } from "@components/images/picture";
import { Anemone } from "@components/landing/anemone";
import { ContainerScroll } from "@components/landing/container-scroll";
import { Navigation } from "@components/landing/navigation";
import { TextGenerated } from "@components/landing/text-generated";
import { GetLayoutWithoutNavigation } from "@components/layout/layout";
import { getServerAuthSession } from "@server/auth";
import type { GetServerSidePropsContext, NextPageWithLayout } from "next";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerAuthSession({
    req: context.req,
    res: context.res,
  });

  if (session) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
const Home: NextPageWithLayout = () => {
  const parent = useRef<HTMLDivElement>(null);

  return (
    <>
      <Navigation />
      <div className="mt-20 flex flex-wrap gap-4 p-4 sm:px-28">
        <div className="w-full" ref={parent}>
          <div className="relative z-10 flex h-[22rem] flex-col items-center justify-end gap-4">
            <h1 className="text-7xl font-extrabold opacity-95 sm:text-9xl">
              Blindparty
            </h1>
            <TextGenerated className="text-center font-bold">
              Meet The Best BlindTest Experience Now
            </TextGenerated>
          </div>
          <ContainerScroll.Root className="relative z-10 flex h-[60rem] items-center justify-center sm:h-[80rem] sm:pt-36">
            <ContainerScroll.Header className="div mx-auto max-w-5xl text-center">
              <h2 className="text-4xl font-semibold text-white">
                Unleash all your
                <br />
                <span className="mt-1 text-4xl font-bold leading-none md:text-6xl lg:text-8xl">
                  Musical Knowledge
                </span>
              </h2>
            </ContainerScroll.Header>
            <ContainerScroll.Content className="mx-auto -mt-12 h-[30rem] w-full max-w-5xl rounded-[30px] border-4 border-white/20 bg-black p-6 shadow-2xl md:h-[40rem]">
              {[
                "https://i.scdn.co/image/ab67706c0000da84c541013e12c6f9be532cd847",
                "https://i.scdn.co/image/ab67706c0000da8400463e0efbf3d1cb3cb346fc",
                "https://mosaic.scdn.co/300/ab67616d00001e022ff76b4da68f018b4735ee59ab67616d00001e024121faee8df82c526cbab2beab67616d00001e0249c982dae436bac27c336f45ab67616d00001e02d26847c68a0002d364b1ca3d",
                "https://mosaic.scdn.co/300/ab67616d00001e022a1049b6d0d2b4c3c0abe7a8ab67616d00001e024121faee8df82c526cbab2beab67616d00001e026bdcdf82ecce36bff808a40cab67616d00001e0270f7a1b35d5165c85b95a0e0",
                "https://i.scdn.co/image/ab67706c0000da84cd6740e818f78c079d7544db",
                "https://i.scdn.co/image/ab67706c0000da8448d62ddbc9e327507f4b4671",
                "https://i.scdn.co/image/ab67706c0000da84dfd3778e8345945f9b9af886",
                "https://mosaic.scdn.co/300/ab67616d00001e020d608cb171987cc9f19854a8ab67616d00001e0221849d5e4f7123f2fe2316c5ab67616d00001e02b6f9c5958390ca9ccf73becbab67616d00001e02bc1684ff9b818ebdccd52427",
                "https://mosaic.scdn.co/300/ab67616d00001e025c496da3475d9ebc56e338eeab67616d00001e02c468160756acecbdf48c9f71ab67616d00001e02ed3818eae8d0e2f7c4864bb6ab67616d00001e02f7870aa5ad56596cf85f9b84",
                "https://mosaic.scdn.co/300/ab67616d00001e02164ec11a1225d579ed030c42ab67616d00001e024aa84b613963d8ad62d245d5ab67616d00001e029c0e4a23aa9172bf4c656705ab67616d00001e02db65cfec2e8e37303140c881",
                "https://mosaic.scdn.co/300/ab67616d00001e020e27181dac939d599730bed0ab67616d00001e021b7844a8c73c4d48f0bca1deab67616d00001e02a291de1be743c7c023f18addab67616d00001e02be27577e261158fda47bd1b6",
                "https://mosaic.scdn.co/300/ab67616d00001e023b85aaac550cff8f27163523ab67616d00001e02b0b9aaf0ef903add8f96ff6eab67616d00001e02e226488b7af9f296c95be551ab67616d00001e02fcfc85c1931e4fb0eda3fcd7",
                "https://mosaic.scdn.co/300/ab67616d00001e022043dd3544a339547d04b436ab67616d00001e0266d63e400881e134337ead54ab67616d00001e029f2023d391c3bd4acf4d51c6ab67616d00001e02a729c9c3dec04b99d889c66f",
                "https://mosaic.scdn.co/300/ab67616d00001e0233dc124d9b4bda6dc442a2a8ab67616d00001e0263f9f6079567d0c1d96ae25aab67616d00001e026c1d363e5cd01b659c8499d2ab67616d00001e029b9b36b0e22870b9f542d937",
                "https://mosaic.scdn.co/300/ab67616d00001e02175ac995106ab6517d3d28a0ab67616d00001e025ec88423e20d9894d88591c6ab67616d00001e02c21aa4015cb02b6b8eca09a4ab67616d00001e02d47377bdf217bdc7a9aa3fe0",
                "https://mosaic.scdn.co/300/ab67616d00001e020cc31a3eba192fbfb2e3d84fab67616d00001e0242a91184c215f8a95b5f77ecab67616d00001e025d191f69e1bcb631b5da3759ab67616d00001e02c1d96c321c15633fe7813893",
                "https://mosaic.scdn.co/300/ab67616d00001e020d608cb171987cc9f19854a8ab67616d00001e0239505eb7ec495325624dabeeab67616d00001e024fb83efbb5201137677c7575ab67616d00001e02e524693aba8849958b1f7e39",
                "https://mosaic.scdn.co/300/ab67616d00001e025c496da3475d9ebc56e338eeab67616d00001e02c468160756acecbdf48c9f71ab67616d00001e02ed3818eae8d0e2f7c4864bb6ab67616d00001e02f7870aa5ad56596cf85f9b84",
                "https://i.scdn.co/image/ab67706c0000da84cd6740e818f78c079d7544db",
                "https://i.scdn.co/image/ab67706c0000da8448d62ddbc9e327507f4b4671",
              ].map((src, idx) => (
                <Picture key={idx} identifier={src}>
                  <img src={src} />
                </Picture>
              ))}
            </ContainerScroll.Content>
          </ContainerScroll.Root>
          <div className="relative z-10 flex w-full flex-col items-center justify-center gap-8 pb-60">
            <h2 className="-mt-60 text-center text-2xl font-semibold text-white md:-mt-40">
              Create Your Own BlindTest
              <br />
              <span className="mt-1 text-4xl font-bold leading-none">
                With Spotify
              </span>
            </h2>
            <Link
              href="/sign-in"
              className="flex items-center justify-between gap-2 text-nowrap rounded-full border border-gray-800 bg-black py-2 pl-2 pr-6 text-lg font-semibold text-white no-underline ring-1 ring-white/5 transition-transform hover:scale-105"
            >
              <SpotifyIcon className="h-14 w-14" />
              Se connecter
            </Link>
          </div>
        </div>
        <div className="relative z-10 w-full py-20">
          <h3 className="-mt-60 text-center text-4xl font-semibold text-white">
            Have A BlindTest Experience
            <br />
            <span className="mt-1 text-4xl font-bold leading-none md:text-8xl">
              Like In A Real Game
            </span>
          </h3>

          <div className="flex flex-wrap gap-10 py-10">
            <div className="flex flex-1 flex-col gap-4">
              <p className="text-center text-2xl font-semibold">
                Use Your Computer As Game Master
              </p>
              <div>
                <div className="relative mx-auto h-[172px] w-[301px] rounded-t-xl border-[8px] border-black bg-black ring-1 ring-white/20 md:h-[294px] md:w-[512px]">
                  <div className="h-[156px] overflow-hidden rounded-lg bg-black md:h-[278px]">
                    <div className="relative flex h-[156px] w-full items-center justify-center rounded-lg bg-gradient-to-br from-neutral-900 to-neutral-800 md:h-[278px]">
                      <Square
                        className="h-32 w-32 rounded-lg"
                        active={true}
                        timing="infinite"
                        speed={30}
                      >
                        <Square.Child className="h-full w-full flex-col overflow-hidden rounded p-0.5">
                          <Image
                            src="/placeholders/blur.png"
                            width={600}
                            height={600}
                            alt="Blured image"
                          />
                        </Square.Child>

                        <Square.Dash className="stroke-white stroke-[3]" />
                      </Square>
                    </div>
                  </div>
                </div>
                <div className="relative mx-auto h-[17px] w-[351px] rounded-b-xl rounded-t-sm bg-black ring-1 ring-white/20 md:h-[21px] md:w-[597px]">
                  <div className="absolute left-1/2 top-0 h-[5px] w-[56px] -translate-x-1/2 rounded-b-xl bg-gradient-to-br from-neutral-900 to-neutral-800 md:h-[8px] md:w-[96px]"></div>
                </div>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-4">
              <p className="text-center text-2xl font-semibold">
                Use Vocal Detection With Your Phone
              </p>
              <div>
                <div className="relative mx-auto h-[320px] w-[165px] rounded-[1.375rem] border-[7.7px] border-black shadow-xl ring-1 ring-white/20">
                  <div className="absolute left-1/2 top-0 h-[9.9px] w-[81.4px] -translate-x-1/2 rounded-b-[0.55rem] bg-black ring-1 ring-white/20"></div>
                  <div className="absolute -start-[9.35px] top-[68.2px] h-[25.3px] w-[1.65px] rounded-s-lg bg-black ring-1 ring-white/20"></div>
                  <div className="absolute -start-[9.35px] top-[97.9px] h-[25.3px] w-[1.65px] rounded-s-lg bg-black ring-1 ring-white/20"></div>
                  <div className="absolute -end-[9.35px] top-[78.1px] h-[35.2px] w-[1.65px] rounded-e-lg bg-black ring-1 ring-white/20"></div>
                  <div className="h-[305px] w-[152px] overflow-hidden rounded-[1.1rem] bg-gray-800">
                    <div className="flex h-[305px] w-[150px] flex-col items-center justify-center bg-gradient-to-br from-neutral-900 to-neutral-800">
                      <span className="animate-pulse">...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-center text-2xl font-semibold text-white">
            Create Or Join A Game To Know With Your Friends
            <br />
            <span className="mt-1 text-4xl font-bold leading-none">
              Who Is The Best
            </span>
          </h2>

          <div className="flex flex-col items-center justify-center py-10">
            <Link
              href="/sign-in"
              className="rounded-full bg-white px-6 py-1 text-center text-2xl font-semibold text-black no-underline transition-transform hover:scale-105"
            >
              S'inscire
            </Link>
          </div>
        </div>
      </div>
      <footer className="relative z-10 h-48 w-full border-t border-gray-800 bg-black/80 backdrop-blur-sm">
        <div className="mx-auto w-full p-4 md:py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
            <a
              href="https://blindparty.com/"
              className="mb-4 flex items-center space-x-3 sm:mb-0 rtl:space-x-reverse"
            >
              <span className="self-center whitespace-nowrap text-2xl font-semibold text-white">
                BlindParty
              </span>
            </a>
            <ul className="mb-6 flex flex-wrap items-center text-sm font-medium text-gray-400 sm:mb-0">
              <li>
                <Link href="/" className="me-4 hover:underline md:me-6">
                  About
                </Link>
              </li>
              <li>
                <Link href="/" className="me-4 hover:underline md:me-6">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/" className="me-4 hover:underline md:me-6">
                  Licensing
                </Link>
              </li>
              <li>
                <Link href="/" className="hover:underline">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <hr className="my-6 border-gray-800 sm:mx-auto lg:my-8" />
          <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">
            © {new Date().getFullYear()}{" "}
            <a href="https://blindparty.com/" className="hover:underline">
              BlindParty™
            </a>
            . All Rights Reserved.
          </span>
        </div>
      </footer>
      <Anemone ref={parent} />
    </>
  );
};

export default Home;
Home.getLayout = GetLayoutWithoutNavigation;
