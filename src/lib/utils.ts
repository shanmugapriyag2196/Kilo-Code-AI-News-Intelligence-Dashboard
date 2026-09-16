export function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs
    .filter((x): x is string => typeof x === "string")
    .join(" ")
    .trim();
}