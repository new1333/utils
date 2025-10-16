import { describe, it, expect, vi } from "vitest";
import { runParallel } from "./parallel";

describe("runParallel", () => {
  it("should process all items and return results in order", async () => {
    const source = [1, 2, 3, 4, 5];
    const iteratorFn = async (item: number) => item * 2;

    const result = await runParallel(3, source, iteratorFn);

    expect(result).toEqual([2, 4, 6, 8, 10]);
  });

  it("should respect maxConcurrency limit", async () => {
    const source = [1, 2, 3, 4, 5];
    let currentlyExecuting = 0;
    let maxConcurrentlyExecuted = 0;

    const iteratorFn = async (item: number) => {
      currentlyExecuting++;
      maxConcurrentlyExecuted = Math.max(
        maxConcurrentlyExecuted,
        currentlyExecuting
      );

      await new Promise((resolve) => setTimeout(resolve, 50));

      currentlyExecuting--;
      return item * 2;
    };

    await runParallel(2, source, iteratorFn);

    expect(maxConcurrentlyExecuted).toBeLessThanOrEqual(2);
  });

  it("should handle empty array", async () => {
    const source: number[] = [];
    const iteratorFn = async (item: number) => item * 2;

    const result = await runParallel(3, source, iteratorFn);

    expect(result).toEqual([]);
  });

  it("should handle single item", async () => {
    const source = [42];
    const iteratorFn = async (item: number) => item.toString();

    const result = await runParallel(1, source, iteratorFn);

    expect(result).toEqual(["42"]);
  });

  it("should handle maxConcurrency greater than source length", async () => {
    const source = [1, 2];
    const iteratorFn = async (item: number) => item * 3;

    const result = await runParallel(10, source, iteratorFn);

    expect(result).toEqual([3, 6]);
  });

  it("should propagate errors from iterator function", async () => {
    const source = [1, 2, 3];
    const iteratorFn = async (item: number) => {
      if (item === 2) {
        throw new Error("Test error");
      }
      return item * 2;
    };

    await expect(runParallel(2, source, iteratorFn)).rejects.toThrow(
      "Test error"
    );
  });

  it("should call iterator function correct number of times", async () => {
    const source = [1, 2, 3, 4];
    const iteratorFn = vi
      .fn()
      .mockImplementation(async (item: number) => item * 2);

    await runParallel(2, source, iteratorFn);

    expect(iteratorFn).toHaveBeenCalledTimes(4);
    expect(iteratorFn).toHaveBeenCalledWith(1);
    expect(iteratorFn).toHaveBeenCalledWith(2);
    expect(iteratorFn).toHaveBeenCalledWith(3);
    expect(iteratorFn).toHaveBeenCalledWith(4);
  });

  it("should handle different types", async () => {
    const source = ["a", "b", "c"];
    const iteratorFn = async (item: string) => item.toUpperCase();

    const result = await runParallel(2, source, iteratorFn);

    expect(result).toEqual(["A", "B", "C"]);
  });
});
