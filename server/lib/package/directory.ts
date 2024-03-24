import path from "path";
import {Controller} from "./controller";
import {Package} from "@lib/package/package";
import fs from 'fs';

export class Directory {
    public readonly name: string;
    constructor(
        public readonly path: string,
    ) {
        this.#init();
    }

    #init() {
        (this as any).path = path.resolve(this.path);
        (this as any).name = this.path.split('/').toReversed()[0];
    }

    public package(out = './out.tar', options = {force: false}): Package {
        return Controller.to(this.path, out, options.force);
    }

    public remove() {
        // @ts-ignore
        fs.rmdirSync(this.path, {recursive: true, force: true});
    }
}
