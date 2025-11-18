import React from 'react';
import { cn } from '@/utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getPages(page: number, total: number) {
  const pages: (number | '…')[] = [];
  const add = (p: number | '…') => pages.includes(p) || pages.push(p);

  add(1);
  if (page > 3) add('…');
  for (let p = Math.max(2, page - 1); p <= Math.min(total - 1, page + 1); p++) add(p);
  if (page < total - 2) add('…');
  if (total > 1) add(total);
  return pages;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange, className }) => {
  const pages = getPages(page, totalPages);
  const go = (p: number) => () => {
    if (p >= 1 && p <= totalPages && p !== page) onPageChange(p);
  };

  return (
    <nav className={cn('flex items-center justify-center gap-2', className)} aria-label="Pagination Navigation">
      <button
        type="button"
        onClick={go(page - 1)}
        disabled={page <= 1}
        className={cn(
          'h-10 min-w-[2.5rem] px-3 rounded-md border text-sm',
          'border-secondary-300 text-secondary-700 hover:bg-secondary-50',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Previous Page"
      >
        Prev
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span key={`ellipsis-${idx}`} className="px-2 text-secondary-500" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={go(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'h-10 min-w-[2.5rem] px-3 rounded-md border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
              p === page
                ? 'bg-primary-600 text-white border-primary-600'
                : 'border-secondary-300 text-secondary-700 hover:bg-secondary-50'
            )}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={go(page + 1)}
        disabled={page >= totalPages}
        className={cn(
          'h-10 min-w-[2.5rem] px-3 rounded-md border text-sm',
          'border-secondary-300 text-secondary-700 hover:bg-secondary-50',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        aria-label="Next Page"
      >
        Next
      </button>
    </nav>
  );
};

export default Pagination;
