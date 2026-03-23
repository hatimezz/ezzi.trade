'use client';

import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface AdminTableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

interface AdminTableProps<T extends Record<string, unknown>> {
  columns: AdminTableColumn<T>[];
  data: T[];
  emptyMessage?: string;
  rowKey: keyof T;
}

type SortDir = 'asc' | 'desc' | null;

export function AdminTable<T extends Record<string, unknown>>({
  columns,
  data,
  emptyMessage = 'No data found.',
  rowKey,
}: AdminTableProps<T>) {
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  function toggleSort(key: keyof T) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      setSortKey(null);
      setSortDir(null);
    }
  }

  const sorted = [...data].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    const cmp =
      typeof av === 'string' && typeof bv === 'string'
        ? av.localeCompare(bv)
        : typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={col.sortable ? 'cursor-pointer select-none' : ''}
                style={{ textAlign: col.align ?? 'left' }}
                onClick={() => col.sortable && toggleSort(col.key)}
              >
                <div className="flex items-center gap-1" style={{ justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start' }}>
                  {col.label}
                  {col.sortable && (
                    <span className="text-gray-600">
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-12 text-gray-600">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={String(row[rowKey])}>
                {columns.map((col) => (
                  <td key={String(col.key)} style={{ textAlign: col.align ?? 'left' }}>
                    {col.render
                      ? col.render(row[col.key], row)
                      : String(row[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
