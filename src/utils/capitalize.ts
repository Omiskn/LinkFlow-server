export function capitalize(str: string | undefined): string | undefined {
  if (!str) return undefined;

  const capWord =
    str.at(0)?.toLocaleUpperCase() + str.slice(1).toLocaleLowerCase();

  return capWord;
}
