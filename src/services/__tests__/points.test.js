// Unit тест за изчисляване на точки
import { calculatePoints } from "../points.js";

describe("calculatePoints", () => {
  it("добавя точки при earn", () => {
    expect(calculatePoints(100, 50, "earn")).toBe(150);
  });
  it("вади точки при spend", () => {
    expect(calculatePoints(100, 30, "spend")).toBe(70);
  });
  it("не променя баланса при невалиден тип", () => {
    expect(calculatePoints(100, 20, "other")).toBe(100);
  });
});
