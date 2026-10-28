import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cat6MonthAnchorToday } from "./cat6-period";

describe("cat6MonthAnchorToday", () => {
  it("keeps October when the month already has rows", () => {
    assert.equal(
      cat6MonthAnchorToday("month", true, 14, "2026-09-21", "2026-10-27"),
      "2026-10-27",
    );
  });

  it("uses last CAT6 register date when this month is empty", () => {
    assert.equal(
      cat6MonthAnchorToday("month", true, 0, "2026-09-21", "2026-10-27"),
      "2026-09-21",
    );
  });

  it("does not change Quad or non-month periods", () => {
    assert.equal(
      cat6MonthAnchorToday("month", false, 0, "2026-09-21", "2026-10-27"),
      "2026-10-27",
    );
    assert.equal(
      cat6MonthAnchorToday("year", true, 0, "2026-09-21", "2026-10-27"),
      "2026-10-27",
    );
  });
});
