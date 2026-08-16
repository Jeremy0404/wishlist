import { expect, test } from "@playwright/test";
import { useToasts } from "../../src/components/ui/useToasts.ts";

const { items, push, clear } = useToasts();

test.describe("useToasts", () => {
  test.beforeEach(() => clear());

  test("stacks the newest toast first", () => {
    push("Article supprimé", "success");
    push("Réservation annulée", "info");

    expect(items.value.map((t) => t.text)).toEqual([
      "Réservation annulée",
      "Article supprimé",
    ]);
  });

  test("dismisses after three seconds unless told otherwise", () => {
    push("Réservé", "success");
    push("Acheté", "success", 8000);

    expect(items.value.map((t) => t.ms)).toEqual([8000, 3000]);
  });

  test("clears one toast without touching the rest", () => {
    push("Article supprimé", "success");
    push("Réservé", "success");

    clear(items.value[0]!.id);

    expect(items.value.map((t) => t.text)).toEqual(["Article supprimé"]);
  });

  test("ignores an empty message", () => {
    push("   ", "info");

    expect(items.value).toHaveLength(0);
  });
});
