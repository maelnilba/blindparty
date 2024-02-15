export const Grid = () => {
  return (
    <>
      <div className="absolute top-0 flex h-[12rem] w-full transform items-center justify-center bg-black bg-dot-gray-900/[1]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:linear-gradient(to_bottom,transparent_20%,black)]"></div>
      </div>
      <div className="absolute bottom-0 flex h-[12rem] w-full transform items-center justify-center bg-black bg-dot-gray-900/[1]">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:linear-gradient(to_top,transparent_20%,black)]"></div>
      </div>
    </>
  );
};
