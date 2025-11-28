// utils/asyncStorage.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ERR, INFO, log, LOG } from './log';



const formatLogError = (baseMessage: string, key: string | null = null, error: unknown): string => {
  const keyPart = key ? ` for key ${key}` : '';
  const errorPart = error instanceof Error ? `: ${error.message}` : '';
  return `🗄️🚨 AsyncStorage Error: ${baseMessage}${keyPart}${errorPart}`;
};



/**
 * Stores a key-value pair in AsyncStorage.
 * The value is stored as a string. 
 * Objects/Arrays must be stringified before calling this function.
 * @param key - The key under which to store the value.
 * @param value - The string value to store.
 * @returns A Promise that resolves when the operation is complete.
 */
export const setItem = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
    log(`🗄️ AsyncStorage: Successfully set item for key: ${key}`, INFO);
  } catch (error) {
    const message = formatLogError('Could not set item', key, error);
    log(message, ERR);
    throw error;
  }
};

/**
 * Retrieves a string value for a given key from AsyncStorage.
 *
 * @param key - The key to retrieve the value for.
 * @returns A Promise that resolves to the string value, or null if the key doesn't exist or on error.
 */
export const getItem = async (key: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    log(`🗄️ AsyncStorage: Retrieved value for key: ${key}`, INFO);
    return value;
  } catch (error) {
    const message = formatLogError('Could not get item', key, error);
    log(message, ERR);
    // Return null on error for graceful failure in a getter
    return null; 
  }
};

/**
 * Retrieves all keys currently stored in AsyncStorage.
 *
 * @returns A Promise that resolves to an array of strings representing all keys.
 */
export const getAllKeys = async (): Promise<readonly string[]> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    log(`🗄️ AsyncStorage: Retrieved all keys: ${JSON.stringify(keys)}`, LOG);
    return keys;
  } catch (error) {
    const message = formatLogError('Could not get all keys', null, error);
    log(message, ERR);
    throw error;
  }
};

/**
 * Stores a JavaScript object by stringifying it first.
 * @param key - The key under which to store the object.
 * @param value - The object to store.
 * @returns A Promise that resolves when the operation is complete.
 */
export const setJSONObject = async <T extends object>(key: string, value: T): Promise<void> => {
  try {
    const stringifiedValue = JSON.stringify(value);
    await setItem(key, stringifiedValue);
  } catch (error) {
    const message = formatLogError('Could not stringify or set object', key, error);
    log(message, ERR);
    throw error;
  }
};

/**
 * Retrieves and parses a JSON object from AsyncStorage.
 * @param key - The key to retrieve the object for.
 * @returns A Promise that resolves to the parsed object, or null if not found/invalid.
 */
export const getJSONObject = async <T extends object>(key: string): Promise<T | null> => {
  try {
    const stringValue = await getItem(key);
    if (stringValue) {
      return JSON.parse(stringValue) as T;
    }
    return null;
  } catch (error) {
    const message = formatLogError('Could not get or parse object', key, error);
    log(message, ERR);
    return null; // Return null on parsing error
  }
};

/**
 * 🗑️ Removes a specific key-value pair from AsyncStorage.
 *
 * @param key - The key to remove.
 * @returns A Promise that resolves when the operation is complete.
 */
export const removeItem = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    log(`🗄️ AsyncStorage: Successfully removed item for key: ${key}`, LOG);
  } catch (error) {
    const message = formatLogError('Could not remove item', key, error);
    log(message, ERR);
    throw error;
  }
};

/**
 * 💣 Clears all key-value pairs from AsyncStorage. Use with extreme caution.
 *
 * @returns A Promise that resolves when the operation is complete.
 */
export const clearAll = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    log('🗄️ AsyncStorage: Successfully cleared all data.', LOG);
  } catch (error) {
    const message = formatLogError('Could not clear all data', null, error);
    log(message, ERR);
    throw error;
  }
};