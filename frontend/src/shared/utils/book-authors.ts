type AuthorName = string | { name: string };

export function mapAuthorNames(authors: readonly AuthorName[]): string[] {
  return authors.map((author) =>
    typeof author === 'string' ? author : author.name,
  );
}
