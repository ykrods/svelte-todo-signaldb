import { SyncManager } from "@signaldb/sync"
import createLocalStorageAdapter from '@signaldb/localstorage'


const apiBaseUrl = import.meta.env.VITE_SYNC_BASE_URL;

const syncManager = new SyncManager<Record<string, any>, { id: string }>({
  id: "self-managed-sync-manager",
  persistenceAdapter: id => createLocalStorageAdapter(id),
  onError(options, error) {
    console.error(error);
  },
  registerRemoteChange({ name }, onChange) {
    console.log(name);

    const handleChange = () => {
      onChange()
    }
    // subscribe events
    const eventSource = new EventSource(`${apiBaseUrl}/events`);

    const onConnect = () => {
      console.log("sse connected");
    }
    eventSource.addEventListener("connected", onConnect);
    eventSource.addEventListener("changed", handleChange);

    return () => {
      console.log("clean");
      eventSource.removeEventListener("connected", onConnect);
      eventSource.removeEventListener("create", handleChange)
    }
  },
  async pull({ name }) {
    // fetch all documents
    const res = await fetch(`${apiBaseUrl}/${name}`);

    if (res.ok) {
      const items = await res.json()
      return { items }
    } else {
      throw new Error("fail to pull")
    }
  },
  async push({ name }, { changes }) {
    await Promise.all(changes.added.map(async (item) => {
      // add document to server
      const res = await fetch(`${apiBaseUrl}/${name}/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item),
      });
    }));

    await Promise.all(changes.modified.map(async (item) => {
      // update document to server
      const res = await fetch(`${apiBaseUrl}/${name}/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(item),
      });
    }));

    await Promise.all(changes.removed.map(async ({ id, ...item }) => {
      // remove document to server
      const res = await fetch(`${apiBaseUrl}/${name}/${id}`, {
        method: "DELETE"
      });
    }));
  }
})

export default syncManager
