import path from "path";
import fs from 'fs';
import {Transpiler, TranspilerOptions} from "bun";
import {File} from './file';
import {URL} from './url';

const imports = new RegExp('(?<!["\'`])\\b(?:import\\s+(?:type\\s+)?{?.*}?\\s+from\\s+[\'"][^\'"]*[\'"]|import\\s*([\'"][^\'"]*[\'"])|const\\s+.*\\s+=\\s+require\\s*([\'"][^\'"]*[\'"]))', 'gm');
const shortComments = new RegExp('(( |\n)//.*?\n)', 'gm');
const longComments = new RegExp('(\\/\\*[\\s\\S]*?\\*\\/)', 'gm');
export class Code {
    public readonly name: string;
    public readonly ext: string;
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

    build(opt?: TranspilerOptions) {
            const transpiler = new Transpiler(opt ?? { loader: 'ts', minifyWhitespace: true, trimUnusedImports: true, inline: true, target: 'browser', tsconfig: {extends: './**.*'}, autoImportJSX: true });
            const transpile = (_path: string, dir?: string): string => {
                if (path.isAbsolute(_path) && !dir) dir = path.dirname(_path);
                if (URL.isURL(_path)) _path = new File(_path).path;
                if (!fs.existsSync(_path) && fs.existsSync(path.resolve(dir, _path))) _path = path.resolve(dir, _path);
                if (!path.extname(_path)) {
                    if (fs.existsSync(_path + '/index.js')) _path += '/index.js';
                    if (fs.existsSync(_path + '/index.jsx')) _path += '/index.jsx';
                    if (fs.existsSync(_path + '/index.ts')) _path += '/index.ts';
                    if (fs.existsSync(_path + '/index.tsx')) _path += '/index.tsx';
                }
                if (fs.existsSync(_path)) {
                    let code = Buffer.from(fs.readFileSync(_path)).toString();
                    code = transpiler.scanImports(code).map((file) => {
                        return transpile(file.path, path.dirname(_path));
                    }).reduce((acc, a) => acc + a, '') + code;
                    code = code.replace(longComments, '');
                    code = code.replace(shortComments, '');
                    code = code.replace(imports, '');
                    try {
                        return transpiler.transformSync(code);
                    }
                    catch (e) {
                        console.log(code);
                        console.error(e.toString().replace(/(\n| )/, ''));
                        return '';
                    }
                }
                console.error(path.resolve(_path));
                console.error('[Code Builder] file is undefined by path:', _path);
                return '';
            }
            return transpile(this.path);
    }
}
