import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Export data to CSV file and trigger download
 * @param data - Array of objects to export
 * @param filename - Name of the file (without .csv extension)
 * @param columns - Optional column configuration for headers and value extraction
 */
export function exportToCsv<T extends Record<string, unknown>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; header: string }[]
) {
  if (data.length === 0) {
    return;
  }

  // Determine columns - use provided columns or infer from first data item
  const cols =
    columns ||
    Object.keys(data[0]!).map((key) => ({
      key: key as keyof T,
      header: key,
    }));

  // Create header row
  const headerRow = cols.map((col) => `"${col.header}"`).join(",");

  // Create data rows
  const dataRows = data.map((row) =>
    cols
      .map((col) => {
        const value = row[col.key];
        // Handle different value types
        if (value === null || value === undefined) {
          return '""';
        }
        if (typeof value === "string") {
          // Escape quotes and wrap in quotes
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return `"${value.toISOString()}"`;
        }
        return `"${String(value)}"`;
      })
      .join(",")
  );

  // Combine header and data rows
  const csvContent = [headerRow, ...dataRows].join("\n");

  // Create blob and trigger download
  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
