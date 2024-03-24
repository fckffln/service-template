Array.prototype.tap = function<T>(this: T[], callback: (value: T, index: number, array: T[]) => void): T[] {
    this.forEach(callback);
    return this;
};

export {Directory} from './directory';
export {Package} from './package';
export {File} from './file';
export {Code} from './code';
