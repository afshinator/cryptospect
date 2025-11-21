// utils/csvImportExport.ts

import { CoinList, CoinListItem } from "@/constants/coinLists";

/**
 * CSV format:
 * Header: List Name, List Notes, Coin ID, Symbol, Name, Coin Notes, Currency, Added At
 * Each row represents one coin in a list
 */

const CSV_HEADER = "List Name,List Notes,Coin ID,Symbol,Name,Coin Notes,Currency,Added At";

/**
 * Escapes a CSV field value (handles commas, quotes, newlines)
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    // Escape quotes by doubling them, then wrap in quotes
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Converts coin lists to CSV format
 */
export function exportCoinListsToCsv(lists: CoinList[]): string {
  const rows: string[] = [CSV_HEADER];

  for (const list of lists) {
    const listName = escapeCsvField(list.name);
    const listNotes = escapeCsvField(list.notes || "");

    if (list.coins.length === 0) {
      // Include empty lists with just list info
      rows.push(`${listName},${listNotes},,,,,"",`);
    } else {
      // Only include list notes in the first row of each list
      let isFirstCoin = true;
      
      for (const coin of list.coins) {
        const coinId = escapeCsvField(coin.coinId);
        const symbol = escapeCsvField(coin.symbol);
        const name = escapeCsvField(coin.name);
        const coinNotes = escapeCsvField(coin.notes || "");
        const currency = escapeCsvField(coin.vsCurrency);
        const addedAt = coin.addedAt.toString();

        // Include list notes only in the first row
        const listNotesField = isFirstCoin ? listNotes : "";
        rows.push(
          `${listName},${listNotesField},${coinId},${symbol},${name},${coinNotes},${currency},${addedAt}`
        );
        
        isFirstCoin = false;
      }
    }
  }

  return rows.join("\n");
}

/**
 * Parses CSV content and converts to coin lists
 */
export function importCoinListsFromCsv(csvContent: string): CoinList[] {
  const lines = csvContent.split("\n").filter((line) => line.trim() !== "");
  
  if (lines.length === 0) {
    throw new Error("CSV file is empty");
  }

  // Skip header row
  const dataLines = lines.slice(1);
  
  if (dataLines.length === 0) {
    throw new Error("CSV file contains no data rows");
  }

  // Parse CSV rows (handling quoted fields)
  const parseCsvRow = (line: string): string[] => {
    const fields: string[] = [];
    let currentField = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        // Field separator
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    fields.push(currentField); // Add last field
    return fields;
  };

  // Group rows by list name
  const listsMap = new Map<string, { notes: string; coins: CoinListItem[] }>();

  for (const line of dataLines) {
    const fields = parseCsvRow(line);

    if (fields.length < 8) {
      // Skip malformed rows (but log warning)
      console.warn(`Skipping malformed CSV row: ${line}`);
      continue;
    }

    const [listName, listNotes, coinId, symbol, name, coinNotes, currency, addedAtStr] = fields;

    // Skip rows with empty list name
    if (!listName || !listName.trim()) {
      continue;
    }

    const trimmedListName = listName.trim();
    const trimmedListNotes = (listNotes || "").trim();

    // Initialize list if not exists
    const isFirstRowForList = !listsMap.has(trimmedListName);
    
    if (isFirstRowForList) {
      // Only read list notes from the first row of each list
      listsMap.set(trimmedListName, {
        notes: trimmedListNotes, // Use notes from first row only
        coins: [],
      });
    }

    const listData = listsMap.get(trimmedListName)!;

    // List notes are already set from the first row, ignore them in subsequent rows

    // Add coin if coin data exists
    if (coinId && coinId.trim()) {
      const addedAt = addedAtStr ? parseInt(addedAtStr, 10) : Date.now();
      
      // Check for duplicate coins in the same list
      const coinExists = listData.coins.some((c) => c.coinId === coinId.trim());
      if (!coinExists) {
        listData.coins.push({
          coinId: coinId.trim(),
          symbol: (symbol || "").trim(),
          name: (name || "").trim(),
          notes: (coinNotes || "").trim(),
          vsCurrency: (currency || "usd").trim() as any,
          addedAt: isNaN(addedAt) ? Date.now() : addedAt,
        });
      }
    }
  }

  // Convert map to CoinList array
  const lists: CoinList[] = [];
  for (const [listName, listData] of listsMap.entries()) {
    lists.push({
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate new ID
      name: listName,
      notes: listData.notes,
      coins: listData.coins,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  }

  return lists;
}

/**
 * Downloads CSV file (web only)
 */
export function downloadCsvFile(content: string, filename: string): void {
  if (typeof window === "undefined") {
    throw new Error("downloadCsvFile is only available on web");
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates default export filename with current date
 */
export function getDefaultExportFilename(): string {
  const date = new Date();
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  return `all-coins-${dateStr}`;
}

