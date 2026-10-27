import { describe, expect, it } from "vitest";
import { insertAt, moveItem, removeAt, replaceAt } from "./listOps";

describe("listOps", () => {
  it("elimina y reemplaza sin mutar", () => {
    const a = ["a", "b", "c"];
    expect(removeAt(a, 1)).toEqual(["a", "c"]);
    expect(replaceAt(a, 2, "z")).toEqual(["a", "b", "z"]);
    expect(a).toEqual(["a", "b", "c"]);
  });

  it("inserta en una posición válida", () => {
    expect(insertAt(["a", "b"], 1, "x")).toEqual(["a", "x", "b"]);
    expect(insertAt(["a"], 99, "x")).toEqual(["a", "x"]);
  });

  it("mueve elementos y respeta los límites", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
    expect(moveItem(["a", "b", "c"], 1, 99)).toEqual(["a", "c", "b"]);
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});
