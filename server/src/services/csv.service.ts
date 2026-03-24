// CSV parsing and validation for product imports

export interface CsvProduct {
  name: string;
  category?: string;
  subcategory?: string;
  features: string[];
  benefits: string[];
  price?: number;
  currency: string;
  brand?: string;
  targetAudience?: string;
  tags: string[];
  images: string[];
}

export interface CsvParseResult {
  rows: CsvProduct[];
  errors: Array<{ row: number; message: string }>;
}

// Split a comma-separated value field (handles quoted commas)
function splitList(value: string): string[] {
  if (!value || !value.trim()) return [];
  return value
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCsv(csvText: string): CsvParseResult {
  const rows: CsvProduct[] = [];
  const errors: Array<{ row: number; message: string }> = [];

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    errors.push({ row: 0, message: "CSV must have a header row and at least one data row" });
    return { rows, errors };
  }

  // Parse header (lowercase, trim)
  const headers = lines[0]!
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ""));

  const nameIdx = headers.indexOf("name");
  if (nameIdx === -1) {
    errors.push({ row: 0, message: 'CSV must have a "name" column' });
    return { rows, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) continue;

    // Simple CSV split (handles quoted fields)
    const values = parseCsvLine(line);

    const get = (col: string) => {
      const idx = headers.indexOf(col);
      return idx !== -1 ? (values[idx] ?? "").trim() : "";
    };

    const name = get("name");
    if (!name) {
      errors.push({ row: i + 1, message: 'Missing required field "name"' });
      continue;
    }

    const priceStr = get("price");
    const price = priceStr ? parseFloat(priceStr) : undefined;
    if (priceStr && isNaN(price!)) {
      errors.push({ row: i + 1, message: `Invalid price value: "${priceStr}"` });
    }

    rows.push({
      name,
      category: get("category") || undefined,
      subcategory: get("subcategory") || undefined,
      features: splitList(get("features")),
      benefits: splitList(get("benefits")),
      price: price && !isNaN(price) ? price : undefined,
      currency: get("currency") || "USD",
      brand: get("brand") || undefined,
      targetAudience: get("targetaudience") || get("target_audience") || undefined,
      tags: splitList(get("tags")),
      images: splitList(get("images")),
    });
  }

  return { rows, errors };
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}
