import { describe, it, expect, vi } from "vitest";
import { getPlanState } from "./state";
import * as fs from "fs/promises";

vi.mock("fs/promises");

describe("getPlanState", () => {
  it("returns parsed payload from correct path", async () => {
    const payload = { proposal: "a", specs: "b", design: "c", tasks: [] };
    vi.mocked(fs.readFile).mockResolvedValueOnce(JSON.stringify(payload));

    const result = await getPlanState("my-feature");

    expect(fs.readFile).toHaveBeenCalledWith("cli-use/changes/my-feature/plan.json", "utf-8");
    expect(result).toEqual(payload);
  });

  it("returns null if file does not exist", async () => {
    const error: any = new Error("ENOENT");
    error.code = "ENOENT";
    vi.mocked(fs.readFile).mockRejectedValueOnce(error);

    const result = await getPlanState("missing-feature");
    expect(result).toBeNull();
  });
});
