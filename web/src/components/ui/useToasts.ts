import { ref, type Ref } from "vue";

export type Toast = {
  id: number;
  text: string;
  kind?: "success" | "error" | "info";
  ms?: number;
};

const items: Ref<Toast[]> = ref([]);
let seq = 1;

/** Singleton composable — every import shares the same list */
export function useToasts() {
  function push(text: string, kind: Toast["kind"] = "info", ms = 2500) {
    const t = String(text ?? "").trim();
    if (!t) return; // ignore empty -> prevents the “black dots”
    const toast: Toast = { id: seq++, text: t, kind, ms };
    items.value.push(toast);
    setTimeout(() => {
      const i = items.value.findIndex((x) => x.id === toast.id);
      if (i !== -1) items.value.splice(i, 1);
    }, ms);
  }

  function clear(id?: number) {
    if (id == null) items.value = [];
    else {
      const i = items.value.findIndex((x) => x.id === id);
      if (i !== -1) items.value.splice(i, 1);
    }
  }

  return { items, push, clear };
}
