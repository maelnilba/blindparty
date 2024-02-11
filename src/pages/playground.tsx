import { Drawer } from "@components/modals/drawer";
import AnonSessionProvider from "@components/providers/anon";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <AnonSessionProvider>
      <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4">
        <div className="h-full">
          <Drawer.Root>
            <Drawer.Button>Open</Drawer.Button>
            <Drawer.Content>
              <div className="relative flex  w-full items-center justify-center">
                {/* Radial gradient for the container to give a faded look */}
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
                <p className="relative z-20 bg-gradient-to-b from-neutral-200 to-neutral-500 bg-clip-text py-8 text-4xl font-bold text-transparent sm:text-7xl">
                  Backgrounds
                </p>
              </div>
            </Drawer.Content>
          </Drawer.Root>
        </div>
      </div>
    </AnonSessionProvider>
  );
};

export default Playground;
