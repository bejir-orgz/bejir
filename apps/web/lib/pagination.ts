export function getPageItems(pageCount: number, pageIndex: number): (number | "ellipsis")[] {
  if (pageCount <= 0) return [];
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);

  const current = Math.min(pageCount, Math.max(1, pageIndex + 1));
  const windowSize = 5;

  // Initial pages (1..5): show 1 2 3 4 5 ... pageCount
  if (current <= windowSize) {
    const items: (number | "ellipsis")[] = [1, 2, 3, 4, 5];
    if (pageCount > windowSize + 1) {
      items.push("ellipsis", pageCount);
    } else if (pageCount === windowSize + 1) {
      items.push(pageCount);
    }
    return items;
  }

  // When current >= 6, show 4 previous pages (e.g. 5, 4, 3, 2 when on page 6) and current
  let start = current - 4;
  let end = current;

  if (end > pageCount) {
    end = pageCount;
    start = Math.max(1, end - 4);
  }

  const items: (number | "ellipsis")[] = [];

  if (start > 1) {
    items.push("ellipsis");
  }

  for (let p = start; p <= end; p++) {
    items.push(p);
  }

  if (pageCount - end > 1) {
    items.push("ellipsis", pageCount);
  } else if (pageCount - end === 1) {
    items.push(pageCount);
  }

  return items;
}

