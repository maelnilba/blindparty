import { useRef, useState } from "react";

export function useCountdown(milliseconds: number) {
  const [count, setCount] = useState(Math.round(milliseconds / 1000));
  const timer = useRef<NodeJS.Timeout | null>(null);

  const start = () =>
    new Promise<void>((res, rej) => {
      let counter = count;
      timer.current = setInterval(() => {
        setCount((c) => c - 1);
        counter = counter - 1;
        if (counter === 0 && timer.current) {
          stop();
          res();
        }
      }, 1000);
    });

  const stop = () => {
    if (timer.current) {
      clearInterval(timer.current);
      setCount(Math.round(milliseconds / 1000));
    }
  };

  return { count, start, stop };
}
