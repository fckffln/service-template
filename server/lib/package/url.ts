import {URL as url} from 'node:url';

export class URL extends url {
    constructor(args) {
        super(args);
    }

    static isURL = (str: string): boolean => {
        try {
            new URL(str);
            return true;
        } catch (e) {
            return false;
        }
    }
}
