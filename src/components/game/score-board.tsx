import { Picture } from "@components/images/picture";
import { RouterOutputs } from "@utils/api";
import { useMemo } from "react";

export type Score = Exclude<
  RouterOutputs["party"]["game"]["guess"],
  undefined
>["players"][number];
type ScoreBoardProps = {
  scores: Score[];
};

export const ScoreBoard = ({ scores }: ScoreBoardProps) => {
  const sorted = useMemo(
    () => scores.sort((a, b) => b.points - a.points),
    [scores]
  );
  const [first, second, third, ...rest] = sorted;

  return (
    <div className="scrollbar-hide relative flex max-h-contain flex-col gap-2 overflow-y-auto pt-8">
      <div className="sticky top-0 z-10 flex flex-col items-start justify-center gap-2 bg-black/5 py-2 backdrop-blur-sm">
        <div className="flex items-center justify-center px-6">
          <div className="z-[2] translate-x-4">
            {second && (
              <ScoreCard
                points={second.points}
                user={second.user}
                className="h-40 w-40"
              />
            )}
          </div>
          <div className="z-[3]">
            {first && (
              <>
                <ScoreCard
                  points={first.points}
                  user={first.user}
                  className="h-48 w-48"
                />
              </>
            )}
          </div>
          <div className="z-[1] -translate-x-4">
            {third && (
              <ScoreCard
                points={third.points}
                user={third.user}
                className="h-32 w-32"
              />
            )}
          </div>
        </div>
      </div>
      <div className="gap-2 p-4">
        {rest.map((p) => (
          <ScoreLine
            key={p.user.id}
            points={p.points}
            user={p.user}
            className="h-12 w-12"
          />
        ))}
      </div>
    </div>
  );
};

const ScoreCard = ({
  points,
  user,
  className,
}: Score & { className: string }) => {
  return (
    <div className="flex flex-col gap-1 text-center">
      <Picture identifier={user.image} className="bg-black">
        <img
          alt={`image of ${user.name}`}
          src={user.image!}
          className={`${className} rounded border-gray-800 bg-black object-cover`}
        />
      </Picture>
      <p className="">{user.name}</p>
      <p className="text-xl font-extrabold">{points}</p>
    </div>
  );
};

const ScoreLine = ({
  points,
  user,
  className,
}: Score & { className: string }) => {
  return (
    <div className="flex flex-row items-center gap-2 p-2 ring-2 ring-white ring-opacity-5">
      <Picture identifier={user.image} className="bg-black">
        <img
          alt={`image of ${user.name}`}
          src={user.image!}
          className={`${className} rounded border-gray-800 bg-black object-cover`}
        />
      </Picture>
      <div className="inline-block w-3/4">
        <span className="block overflow-hidden truncate text-ellipsis">
          {user.name}
        </span>
        {/* <span className="text-sm">{playlist._count.tracks} tracks</span> */}
      </div>
      <p className="text-xl font-extrabold">{points}</p>
    </div>
  );
};
