import colors from "colors/safe";

const pad = (value: number): string => String(value).padStart(2, "0");

const now = (): string => {
  const dt = new Date();

  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(
    dt.getDate(),
  )} ${pad(dt.getHours())}:${pad(dt.getMinutes())}:${pad(dt.getSeconds())}`;
};

const exec = (
  type: "log" | "error" | "warn",
  color: (str: string) => string,
  message: string,
): void => {
  console[type](
    `${color("dirsync")} ${colors.gray(">")} ${now()} ${colors.gray(
      ">",
    )} ${message}`,
  );
};

export const log = (message: string): void =>
  exec("log", colors.green, message);

export const error = (message: string): void =>
  exec("error", colors.red, message);

export const warn = (message: string): void =>
  exec("warn", colors.yellow, message);
