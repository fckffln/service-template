import {Router, RouterController} from "../router";
import {Logger} from "../logger";
import {Server} from "bun";
import * as fs from "fs";
import path from "path";
import logRouter from "../routes/log.router";
import fileRouter from "../routes/file.router";
import {PathResolve} from "@shared/route/build-backend-routes";
import internal from "node:stream";
import codePushRouter from "@lib/bun/routes/code-push.router";

type ServerOptions = {
    routers?: ((request: Request, response: typeof Response) => Promise<any>)[];
    port?: number;
    host?: string;
    mode?: any;
    ssl?: boolean;
    log?: {
        path?: string;
        limit?: number;
        exception?: (type: 'log' | 'error', args: any[]) => boolean;
        router?: string;
    }
}

const defaultOptions: ServerOptions = {
    routers: [],
    port: 3001,
    host: '0.0.0.0',
    mode: 'production',
    ssl: false,
    log: {
        path: `./temp/log/${new Date()}.log`,
        limit: 100,
        exception: (type, args) => {
            switch (type) {
                case 'log':
                    if ((args ?? []).join('').includes('favicon.ico')) return false;
                    return true;
                case 'error':
                default:
                    return true;
            }
        },
        router: '/internal/log',
    }
}
const tempStore = {
    internalId: 0,
}

export default (options: ServerOptions = defaultOptions) => {
    options = {...defaultOptions, ...options, log: {...defaultOptions.log, ...options?.log}};
    Logger.setup({
        logPath: path.resolve(options.log.path),
        limit: options.log.limit,
        exception: (type, args) => {
            switch (type) {
                case 'log':
                    if ((args ?? []).join('').includes('favicon.ico')) return false;
                    return options.log.exception(type, args);
                case 'error':
                default:
                    return options.log.exception(type as any, args);
            }
        },
        routerPath: options.log.router,
    });
    const server = Bun.serve({
        async fetch(request: Request, server: Server): Promise<Response> {
            tempStore.internalId++;
            (request as any).id = tempStore.internalId;
            return RouterController(request, Response)(
                logRouter,
                codePushRouter,
                (request, response) => RouterController(request, response)(
                ...options.routers
                // ...options.routers.toReversed()
                ),
                fileRouter,
                Router({key: 'Exception', pathResolver: () => PathResolve.Root, callback: async () => {
                return new Response(
                    await new Promise((resolve, reject) => resolve(fs.readFileSync('/usr/src/server/404.html').buffer)).catch(() => fs.readFileSync('server/404.html').buffer).catch(() => '404 Not Found') as any,
                    { headers: { 'Content-Type': 'text/html' }, status: 404 }
                );
            }, debug: true}));
        },
        port: options?.port,
        hostname: options?.host,
        development: options?.mode === 'development',
        ...(options?.ssl ? {
            cert: Bun.file('environments/security/localhost.crt'),
            key: Bun.file('environments/security/localhost.key'),
        } : {}),
    });
    console.clear();
    Logger.log.bind({id: NaN, key: 'System'})(`Server started on host: ${options?.ssl ? 'https' : 'http'}://${options?.host ?? 'localhost'}:${options?.port ?? 3001}`);
    return server;
}
