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
    <div className="flex h-[32rem] flex-1 flex-col items-center justify-center gap-2">
      <div className="grid h-60 grid-cols-12">
        <div className="col-span-3 flex items-end justify-center">
          {second && (
            <ScoreCard
              points={second.points}
              user={second.user}
              className="h-32 w-32"
            />
          )}
        </div>
        <div className="relative col-span-6 flex flex-col items-center justify-end gap-2">
          {first && (
            <>
              <p className="absolute -top-20 text-9xl">👑</p>
              <ScoreCard
                points={first.points}
                user={first.user}
                className="h-48 w-48"
              />
            </>
          )}
        </div>
        <div className="col-span-3 flex items-end justify-center">
          {third && (
            <ScoreCard
              points={third.points}
              user={third.user}
              className="h-28 w-28"
            />
          )}
        </div>
      </div>
      <div className="flex w-full flex-wrap gap-2 p-8 ">
        {rest.map((p) => (
          <ScoreCard points={p.points} user={p.user} className="h-12 w-12" />
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
      <Picture identifier={user.image}>
        <img
          alt={`image of ${user.name}`}
          src={user.image!}
          className={`${className} rounded-sm border-gray-800`}
        />
      </Picture>
      <p className="">{user.name}</p>
      <p className="text-xl font-extrabold">{points}</p>
    </div>
  );
};
