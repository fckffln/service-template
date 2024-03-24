import("bun-types").catch(() => {});
interface Array<T> {
    tap(callback: (value: T, index: number, array: T[]) => void): T[];
}
