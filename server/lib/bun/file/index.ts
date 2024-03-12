import * as fs from "fs";
import {RouterTools} from "../router";
// @ts-ignore
const {Mime} = await import("mime");
const mimeTypes = [await import("mime/types/standard.js").then((m) => m.default), await import("mime/types/other.js").then((m) => m.default)];
const mime = new Mime(...mimeTypes);

export const TryFiles = async (...paths: string[]): Promise<{content: any, type: string}> => {
    return new Promise(async (resolve, reject) => {
        if (!paths?.length) reject('Not found');
        try {
            resolve({content: fs.readFileSync(paths[0]).buffer, type: mime.getType(paths[0])});
        }
        catch (e) {
            if (paths.slice(1)?.length)
                try {
                    resolve(await TryFiles(...paths.slice(1)));
                }
                catch (e) {
                    reject('Not found');
                }
            else
                reject('Not found');
        }
    })
}

export const TryFilesRequest = (request: Request, response: typeof Response, tools: RouterTools) => async (factory: (tools: RouterTools, ) => string[]) => {
    const url: any = new URL(request.url);
    const fileName = url.pathname?.split('/')?.toReversed()[0];
    return TryFiles(...factory({...tools, url, fileName})).then((file) => {
        return new response(file.content, { headers: { 'Content-Type': file.type } });
    }).catch((e) => {
        tools.console.error.bind({id: NaN, key: 'System'})(fileName, 'Not found');
        return null;
    });
}
