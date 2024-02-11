const calculatePercentage = (value: number, range: [number, number]): number =>
  value < range[0] || value > range[1]
    ? (() => {
        throw new Error(
          `Value ${value} is not within the range ${range[0]} to ${range[1]}`
        );
      })()
    : ((value - range[0]) / (range[1] - range[0])) * 100;

export const percent = calculatePercentage;
