export const Grid = () => {
  return (
    <div className="absolute top-0 flex h-[40rem] w-full transform items-center justify-center bg-black bg-grid-gray-900/[1]">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black [mask-image:linear-gradient(to_bottom,transparent_20%,black)]"></div>
    </div>
  );
};
