export function getPageItems(pageCount: number, pageIndex: number): (number | "ellipsis")[] {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const current = Math.min(pageCount, Math.max(1, pageIndex + 1));
  const pages = new Set([1, pageCount]);
  for (let page = Math.max(2, current - 1); page <= Math.min(pageCount - 1, current + 1); page++) pages.add(page);
  if (current <= 2) { pages.add(2); pages.add(3); }
  if (current >= pageCount - 1) { pages.add(pageCount - 2); pages.add(pageCount - 1); }
  const sorted = [...pages].sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];
  sorted.forEach((page, index) => {
    if (index && page - sorted[index - 1] > 1) result.push("ellipsis");
    result.push(page);
  });
  return result;
}

