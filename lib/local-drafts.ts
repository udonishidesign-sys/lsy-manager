/**
 * 同じブラウザ・端末で入力途中のフォームを復元するための IndexedDB 保存処理。
 * File オブジェクトも保存できるため、選択した写真をページ移動後も復元できます。
 */
const DB_NAME = "lsy-manager-local-drafts";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

type DraftRecord<T> = { key: string; value: T; updatedAt: number };

function openDraftDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("このブラウザでは下書き保存を利用できません。"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("下書きDBを開けませんでした。"));
  });
}

export async function saveLocalDraft<T>(key: string, value: T): Promise<void> {
  const database = await openDraftDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put({ key, value, updatedAt: Date.now() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("下書きを保存できませんでした。"));
      transaction.onabort = () => reject(transaction.error ?? new Error("下書き保存が中断されました。"));
    });
  } finally {
    database.close();
  }
}

export async function getLocalDraft<T>(key: string): Promise<T | null> {
  const database = await openDraftDatabase();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
      request.onsuccess = () => {
        const record = request.result as DraftRecord<T> | undefined;
        resolve(record?.value ?? null);
      };
      request.onerror = () => reject(request.error ?? new Error("下書きを読み込めませんでした。"));
    });
  } finally {
    database.close();
  }
}

export async function deleteLocalDraft(key: string): Promise<void> {
  const database = await openDraftDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(key);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("下書きを削除できませんでした。"));
      transaction.onabort = () => reject(transaction.error ?? new Error("下書き削除が中断されました。"));
    });
  } finally {
    database.close();
  }
}
