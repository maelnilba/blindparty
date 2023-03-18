const start_end = <T extends any[]>(arr: T): [T[number], T[number]] => {
  if (arr.length < 2) {
    throw new Error("Array must have at least 2 elements");
  }
  const [start, ...__] = arr;
  const end = arr[arr.length - 1];
  return [start, end];
};
type secondIntlFormat = "hh:mm:ss" | "hh:mm" | "mm:ss";
export const secondIntl = (
  second: number,
  format: secondIntlFormat = "hh:mm:ss"
) => {
  const f = {
    hh: 11,
    mm: 14,
    ss: 17,
  };

  const s = format.split(":") as ("hh" | "mm" | "ss")[];
  const [start, end] = start_end(s);
  const startIndex = f[start];
  const endIndex = f[end];

  return new Date(second * 1000).toISOString().slice(startIndex, endIndex + 2);
};
