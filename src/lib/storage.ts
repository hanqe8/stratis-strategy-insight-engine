import Dexie, { type Table } from "dexie";
import { sampleStore } from "../data/sample-projects";
import type { StrategyStore } from "../types/store";
import { ensureStoreConfig } from "./config";

const STORAGE_KEY = "esio.strategyStore.v1";
const STORE_ID = "active";
const OPENROUTER_KEY = "esio.openRouterApiKey.session";

interface StoreRecord {
  id: string;
  store: StrategyStore;
  updatedAt: string;
}

class StrategyDb extends Dexie {
  stores!: Table<StoreRecord, string>;

  constructor() {
    super("ExecutiveStrategyIntelligenceOS");
    this.version(1).stores({
      stores: "id, updatedAt"
    });
  }
}

const db = new StrategyDb();

export function loadStore(): StrategyStore {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return ensureStoreConfig(sampleStore);

  try {
    return ensureStoreConfig(JSON.parse(raw) as Partial<StrategyStore>);
  } catch {
    return ensureStoreConfig(sampleStore);
  }
}

export async function loadStoreAsync(): Promise<StrategyStore> {
  try {
    const record = await db.stores.get(STORE_ID);
    if (record?.store) return ensureStoreConfig(record.store);
  } catch {
    // LocalStorage fallback keeps the app usable in restrictive browser modes.
  }
  return loadStore();
}

export function saveStore(store: StrategyStore): void {
  const normalized = ensureStoreConfig(store);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  void db.stores.put({ id: STORE_ID, store: normalized, updatedAt: new Date().toISOString() });
}

export function clearStore(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  void db.stores.delete(STORE_ID);
}

export function exportStore(store: StrategyStore): string {
  return JSON.stringify(store, null, 2);
}

export function getOpenRouterApiKey(): string {
  return window.sessionStorage.getItem(OPENROUTER_KEY) ?? "";
}

export function setOpenRouterApiKey(value: string): void {
  if (value.trim()) {
    window.sessionStorage.setItem(OPENROUTER_KEY, value.trim());
    return;
  }
  window.sessionStorage.removeItem(OPENROUTER_KEY);
}
