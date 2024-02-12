import { Wouter } from "modules/wouter";
import { NextPageWithLayout } from "next";

const Playground: NextPageWithLayout = () => {
  return (
    <div className="scrollbar-hide flex flex-1 items-center justify-center gap-4">
      <div className="h-full">
        <Wouter.Routes baseUrl="/test">
          <Wouter.Route pattern="/">
            <Wouter.Link href="/home">Go to Home</Wouter.Link>
            <Wouter.Link href="/home/9">Go to ID</Wouter.Link>
            <div>Hello</div>
          </Wouter.Route>
          <Wouter.Route pattern="/home">
            <Wouter.Link href="/">Go to /</Wouter.Link>
            <div>Home</div>
          </Wouter.Route>
          <Wouter.Route pattern="/home/:id">
            <Wouter.Link href="/">Go to /</Wouter.Link>
            <div>ID</div>
          </Wouter.Route>
        </Wouter.Routes>
      </div>
    </div>
  );
};

export default Playground;
