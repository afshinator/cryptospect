// utils/coinListStorage.ts

import { CoinList } from "@/constants/coinLists";
import { COIN_LISTS_STORAGE_KEY } from "@/constants/misc";
import { getJSONObject, setJSONObject } from "@/utils/asyncStorage";

/**
 * Get all coin lists from storage
 */
export async function getCoinLists(): Promise<CoinList[]> {
  try {
    const lists = await getJSONObject<CoinList[]>(COIN_LISTS_STORAGE_KEY);
    return lists || [];
  } catch (error) {
    console.error("Error reading coin lists:", error);
    return [];
  }
}

/**
 * Save all coin lists to storage
 */
export async function saveCoinLists(lists: CoinList[]): Promise<void> {
  try {
    await setJSONObject(COIN_LISTS_STORAGE_KEY, lists);
  } catch (error) {
    console.error("Error saving coin lists:", error);
    throw error;
  }
}

