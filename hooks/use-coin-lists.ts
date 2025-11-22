import { CoinList, CoinListItem } from "@/constants/coinLists";
import { COIN_LISTS_QUERY_KEY } from "@/constants/misc";
import { getCoinLists, saveCoinLists } from "@/utils/coinListStorage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to get all coin lists
 */
export function useCoinLists() {
  return useQuery({
    queryKey: COIN_LISTS_QUERY_KEY,
    queryFn: getCoinLists,
    staleTime: 0, // Always check storage for latest data
    refetchOnWindowFocus: true, // Refetch when screen comes into focus
  });
}

/**
 * Hook to create a new coin list
 */
export function useCreateCoinList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (list: Omit<CoinList, "id" | "createdAt" | "updatedAt">) => {
      const existingLists = await getCoinLists();
      
      // Trim and normalize the name for comparison
      const trimmedName = list.name.trim();
      
      // Check for duplicate name (case-insensitive)
      const nameExists = existingLists.some(
        (l) => l.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (nameExists) {
        throw new Error("A list with this name already exists");
      }
      
      const newList: CoinList = {
        ...list,
        name: trimmedName,
        id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const updatedLists = [...existingLists, newList];
      await saveCoinLists(updatedLists);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(COIN_LISTS_QUERY_KEY, updatedLists);
      
      return newList;
    },
    onSuccess: async () => {
      // Refetch to ensure consistency with storage
      await queryClient.refetchQueries({ queryKey: COIN_LISTS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update an existing coin list
 */
export function useUpdateCoinList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CoinList> }) => {
      const existingLists = await getCoinLists();
      
      // If updating the name, check for duplicates (excluding current list)
      if (updates.name) {
        // Trim and normalize the name for comparison
        const trimmedName = updates.name.trim();
        
        const nameExists = existingLists.some(
          (l) =>
            l.id !== id &&
            l.name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        
        if (nameExists) {
          throw new Error("A list with this name already exists");
        }
        
        // Use trimmed name in updates
        updates.name = trimmedName;
      }
      
      const updatedLists = existingLists.map((list) =>
        list.id === id
          ? { ...list, ...updates, updatedAt: Date.now() }
          : list
      );
      await saveCoinLists(updatedLists);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(COIN_LISTS_QUERY_KEY, updatedLists);
      
      return updatedLists.find((list) => list.id === id)!;
    },
    onSuccess: async () => {
      // Refetch to ensure consistency with storage
      await queryClient.refetchQueries({ queryKey: COIN_LISTS_QUERY_KEY });
    },
  });
}

/**
 * Hook to delete a coin list
 */
export function useDeleteCoinList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const existingLists = await getCoinLists();
      const updatedLists = existingLists.filter((list) => list.id !== id);
      await saveCoinLists(updatedLists);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(COIN_LISTS_QUERY_KEY, updatedLists);
      
      return id;
    },
    onSuccess: async () => {
      // Refetch to ensure consistency with storage
      await queryClient.refetchQueries({ queryKey: COIN_LISTS_QUERY_KEY });
    },
  });
}

/**
 * Hook to add a coin to a list
 */
export function useAddCoinToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      coin,
    }: {
      listId: string;
      coin: Omit<CoinListItem, "addedAt">;
    }) => {
      const existingLists = await getCoinLists();
      const updatedLists = existingLists.map((list) => {
        if (list.id === listId) {
          // Check if coin already exists in list
          const exists = list.coins.some((c) => c.coinId === coin.coinId);
          if (exists) {
            return list; // Don't add duplicate
          }
          return {
            ...list,
            coins: [
              ...list.coins,
              { ...coin, addedAt: Date.now() },
            ],
            updatedAt: Date.now(),
          };
        }
        return list;
      });
      await saveCoinLists(updatedLists);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(COIN_LISTS_QUERY_KEY, updatedLists);
      
      return updatedLists.find((list) => list.id === listId)!;
    },
    onSuccess: async () => {
      // Refetch to ensure consistency with storage
      await queryClient.refetchQueries({ queryKey: COIN_LISTS_QUERY_KEY });
    },
  });
}

/**
 * Hook to remove a coin from a list
 */
export function useRemoveCoinFromList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, coinId }: { listId: string; coinId: string }) => {
      const existingLists = await getCoinLists();
      const normalizedCoinId = coinId.toLowerCase();
      const updatedLists = existingLists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            coins: list.coins.filter((c) => c.coinId.toLowerCase() !== normalizedCoinId),
            updatedAt: Date.now(),
          };
        }
        return list;
      });
      await saveCoinLists(updatedLists);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(COIN_LISTS_QUERY_KEY, updatedLists);
      
      return updatedLists.find((list) => list.id === listId)!;
    },
    onSuccess: async () => {
      // Refetch to ensure consistency with storage
      await queryClient.refetchQueries({ queryKey: COIN_LISTS_QUERY_KEY });
    },
  });
}

/**
 * Hook to update coin notes in a list
 */
export function useUpdateCoinNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listId,
      coinId,
      notes,
    }: {
      listId: string;
      coinId: string;
      notes: string;
    }) => {
      const existingLists = await getCoinLists();
      const updatedLists = existingLists.map((list) => {
        if (list.id === listId) {
          return {
            ...list,
            coins: list.coins.map((coin) =>
              coin.coinId === coinId ? { ...coin, notes: notes.trim() } : coin
            ),
            updatedAt: Date.now(),
          };
        }
        return list;
      });
      await saveCoinLists(updatedLists);
      
      // Optimistically update the cache immediately
      queryClient.setQueryData(COIN_LISTS_QUERY_KEY, updatedLists);
      
      return updatedLists.find((list) => list.id === listId)!;
    },
    onSuccess: async () => {
      // Refetch to ensure consistency with storage
      await queryClient.refetchQueries({ queryKey: COIN_LISTS_QUERY_KEY });
    },
  });
}