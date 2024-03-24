import {Controller} from "@lib/package/controller";
import path from "path";
import {Directory} from "@lib/package/directory";
import fs from 'fs';

export class Package {
    public readonly name: string;
    public readonly ext: 'zip' | 'tar';
    constructor(
        public readonly path: string,
    ) {
        this.#init();
    }

    #init() {
        (this as any).path = path.resolve(this.path);
        (this as any).name = this.path.split('/').toReversed()[0].split('.')[0];
        (this as any).ext = this.path.split('/').toReversed()[0].split('.')[1];
    }

    public write(buffer: ArrayBufferLike) {
        const dir = path.dirname(this.path);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(this.path, Buffer.from(buffer));
    }

    public extract(out = '/out', options= {force: false}): Directory {
        return Controller.from(this.path, out, options.force);
    }

    public remove() {
        fs.rmSync(this.path);
    }

    get buffer() {
        return fs.readFileSync(this.path).buffer;
    }
}
