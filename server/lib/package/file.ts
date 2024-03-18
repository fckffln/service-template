import path from "path";
import {Directory} from "@lib/package/directory";
import fs from 'fs';
import {randomUUID} from "node:crypto";
import mime from '../bun/mime';
import {URL} from './url';

export class File {
    public readonly name: string;
    public readonly ext: string;
    constructor(
        public readonly path: string,
    ) {
        this.#init();
    }

    #init() {
        const _init = () => {
            (this as any).path = path.resolve(this.path);
            (this as any).name = this.path.split('/').toReversed()[0].split('.')[0];
            (this as any).ext = this.path.split('/').toReversed()[0].split('.')[1];
        };
        if (URL.isURL(this.path)) {
            if (externalFiles.has(this.path) && fs.existsSync(externalFiles.get(this.path))) {
                (this as any).path = externalFiles.get(this.path);
                _init();
            }
            else {
                externalFiles.delete(this.path);
                const tempExecutor = new File(`temp/system/executor/${randomUUID()}.js`);
                tempExecutor.write(`
                new Promise((resolve, reject) => {
                    const control = new AbortController();
                    try {
                        fetch('${this.path}', {signal: control.signal, cache: 'no-cache'})
                        .then(async (data) => ({data: await data.text(), type: data.headers.get('Content-type')})).then((response) => {
                            resolve(JSON.stringify(response));
                        });
                    }
                    catch (e) {}
                    setTimeout(() => {
                        control.abort('timeout');
                        resolve({});
                    }, 15000);
                }).then((data) => {
                    console.log(data);
                    process.exit(0);
                });
            `);
                const execute = (): string => {
                    let iteration = 0;
                    let res = '';
                    while (iteration <= 10 && res?.length && res !== '{}') {
                        iteration++;
                        let executor = Bun.spawnSync(['bun', 'run', tempExecutor.path]);
                        let res = Buffer.from(executor.stdout).toString();
                        let err = Buffer.from(executor.stderr).toString();
                        if (!res?.length) {
                            if (iteration === 10) throw new Error(err);
                            else console.error(err);
                        }
                    }
                    while (!res.startsWith('{') || !res.endsWith('}')) {
                        if (!res.startsWith('{')) res = res.slice(1);
                        if (!res.endsWith('}')) res = res.slice(0, -1);
                    }
                    return res;
                }
                let res = execute();
                try {
                    console.log(JSON.parse(res));
                }
                catch (e) {
                    console.log(res);
                    console.error(e);
                }
                let response = JSON.parse(res ?? '{}') ?? {};
                response = {data: '', type: undefined, ...response};
                let ext = '';
                if (response?.type) ext = mime.getExtension(response?.type);
                let pathname = `temp/download/${randomUUID()}${ext ? `.${ext}` : ''}`;
                new File(pathname).write(response?.data ?? '');
                externalFiles.set(this.path, path.resolve(pathname));
                (this as any).path = pathname;
                _init();
                tempExecutor.remove();
            }
        }
        else _init();
    }

    public get directory(): Directory {
        return new Directory(path.dirname(this.path));
    }

    public write(content: ArrayBufferLike | string) {
        const dir = path.dirname(this.path);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        try {
            fs.writeFileSync(this.path, typeof content === 'string' ? content :  Buffer.from(content));
            return true;
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }

    public read(): Buffer | null {
        if (!fs.existsSync(this.path)) return null;
        return Buffer.from(fs.readFileSync(this.path).buffer);
    }

    public remove() {
        fs.rmSync(this.path);
    }
}

class FileMap<KEY = any, VALUE = any> {
    private readonly target = new Map<KEY, VALUE>();
    private readonly file: File;
    constructor(path: string) {
        this.file = new File(path);
    }

    delete(p: KEY): boolean {
        this.target.delete(p);
        const externalListContent = this.file.read();
        let content: object;
        if (externalListContent) content = {...JSON.parse(externalListContent.toString()), ...Object.fromEntries(this.target.entries())};
        else content = Object.fromEntries(this.target.entries());
        content = Object.keys(content).filter((key) => key !== p).reduce((acc, a) => ({...acc, [a]: content[a]}), {})
        return this.file.write(JSON.stringify(content));
    }

    get(p: KEY): VALUE | undefined {
        return this.target.get(p) ?? ((() => {
            const listStr = this.file.read();
            if (!listStr) return undefined;
            return JSON.parse(listStr.toString())[p];
        })());
    };
    set(p: KEY, newValue: VALUE): boolean {
        this.target.set(p, newValue);
        const externalListContent = this.file.read();
        let content: string;
        if (externalListContent) content = JSON.stringify({...JSON.parse(externalListContent.toString()), ...Object.fromEntries(this.target.entries())});
        else content = JSON.stringify(Object.fromEntries(this.target.entries()));
        return this.file.write(content);
    };
    has(p: KEY): boolean {
        if (this.target.has(p)) return true;
            return !!((() => {
            const listStr = this.file.read();
            if (!listStr) return undefined;
            return JSON.parse(listStr.toString())[p];
        })())
    };
    ownKeys(): ArrayLike<KEY> {
        return Object.keys(((() => {
            const listStr = this.file.read();
            if (!listStr) return undefined;
            return JSON.parse(listStr.toString());
        })())) as any;
    }
}
const externalFiles = new FileMap('temp/download/.list');
