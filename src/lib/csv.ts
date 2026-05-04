export interface SummaryStats {
  field: string;
  count: number;
  min: number;
  max: number;
  average: number;
}

export function getNumericFields(rows: Record<string, string | number>[]): string[] {
  if (!rows.length) return [];
  return Object.keys(rows[0]).filter((field) =>
    rows.some((row) => Number.isFinite(Number(row[field])))
  );
}

export function summarizeField(
  rows: Record<string, string | number>[],
  field: string
): SummaryStats | undefined {
  const values = rows
    .map((row) => Number(row[field]))
    .filter((value) => Number.isFinite(value));

  if (!values.length) return undefined;

  const sum = values.reduce((total, value) => total + value, 0);
  return {
    field,
    count: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: Number((sum / values.length).toFixed(2))
  };
}
