import BunLogger from '../logger';
import {TryFilesRequest} from "../file";
import * as _path from 'path';
import {PathResolve} from "@shared/route/build-backend-routes";

let internalId = 1;

export type RouterTools = {
  console: { log: (...args) => void, error: (...args) => void },
  cookies: { [key: string]: string },
  tryFiles: ReturnType<typeof TryFilesRequest>,
  createPath: typeof createPath,
  url: typeof URL.prototype,
  fileName: string;
  resolve: typeof _path.resolve,
  path: typeof _path,
};

type RouterCallback = (
    request: Request,
    response: typeof Response,
    tools: RouterTools
) => Promise<any> | void

type PathResolver = (url: typeof URL.prototype, cookies: { [key: string]: string }) => PathResolve | Promise<PathResolve>;

type RouterOptions = {
  key?: string;
  pathResolver?: PathResolver,
  callback?: RouterCallback,
  debug?: boolean;
};

const defaultOptions: RouterOptions = {
  key: 'Untitled Router', pathResolver: ((url, cookies = {}) => PathResolve.Disabled) as PathResolver, callback: (() => {}) as RouterCallback, debug: false
};

export const Router = (options?: RouterOptions) => {
  options = {...defaultOptions, ...options};
  return async (request, response) => {
    const url = new URL(request.url);
    const log = BunLogger.log.bind({key: options?.key, id: internalId, requestId: request.id});
    const error = BunLogger.error.bind({key: options?.key, id: internalId, requestId: request.id});
    const requestName = url.pathname + url.search;
    const cookiesHeader = request.headers.get('Cookie');
    const cookies = cookiesHeader ? parseCookies(cookiesHeader) : {};
    let res = null;
    let isPath = options.pathResolver(new URL(request.url), cookies);
    let pathResult = isPath instanceof Promise ? await isPath : isPath;
    if (pathResult !== PathResolve.Disabled) {
      if (options.debug && pathResult === PathResolve.Root) {
        internalId++;
        log('new request:', requestName);
      }
      try {
        const newArgs = (args) => [requestName, ' >> ', ...args];
        const _console = {
          log: (...args) => options.debug ? log(...newArgs(args)) : console.log(...newArgs(args)),
          error: (...args) => options.debug ? error(...newArgs(args)) : console.error(...newArgs(args)),
        };
        const fileName = url.pathname?.split('/')?.toReversed()[0];
        let _tools: Omit<RouterTools, 'tryFiles'> = {
          console: _console,
          cookies,
          createPath,
          url,
          fileName,
          path: _path,
          resolve: _path.resolve,
        }
        let tools: RouterTools = {
          ..._tools,
          tryFiles: TryFilesRequest(request, response, _tools as any),
        };
        res = await options.callback(request, response, {
          ...tools,
          tryFiles: TryFilesRequest(request, response, tools),
        });
        if (!res) res = null;
        if (options.debug && pathResult === PathResolve.Root && res !== null) {
          log('request has success:', requestName);
        }
      } catch (e) {
        if (options.debug && pathResult === PathResolve.Root) {
          log('request has error:', requestName);
          error(e);
        }
        return e;
      }
    }
    return res;
  };
}

export const RouterController = (request: Request, response: typeof Response | any) => async (...routers: ReturnType<typeof Router>[]) => {
  let res;
  for (const router of routers) {
    const routerRes = await router(request, response);
    if (routerRes instanceof Response) {
      res = routerRes;
      break;
    }
  }
  return res;
}

export default Router;

function parseCookies(cookiesHeader: string): { [key: string]: string } {
  const cookies: { [key: string]: string } = {};
  const pairs = cookiesHeader.split(/; */);

  for (const pair of pairs) {
    // Пытаемся найти первый символ '=', который разделяет имя и значение куки
    const eqIdx = pair.indexOf('=');

    // Если '=' не найден, пропускаем пару
    if (eqIdx === -1) continue;

    // Извлекаем имя и значение, декодируем значение из URL-кодировки
    const key = pair.substr(0, eqIdx).trim();
    let value = pair.substr(eqIdx + 1, pair.length).trim();

    // Удаляем кавычки вокруг значения, если они есть
    if (value[0] === '"' && value[value.length - 1] === '"') {
      value = value.slice(1, -1);
    }

    try {
      // Декодируем значение куки, если оно было закодировано с помощью encodeURIComponent
      value = decodeURIComponent(value);
    } catch (e) {
      // Если декодирование не удалось, используем исходное значение
    }

    // Добавляем куку в объект
    cookies[key] = value;
  }

  return cookies;
}

const defaultCreatePathOptions = {
  firstLine: '',
  regExp: true,
}

export const createPath = (options, ...path): RegExp | string => {
  let firstLine;
  if (!options) options = defaultCreatePathOptions;
  if (typeof options === 'string') {
    firstLine = options;
    options = defaultCreatePathOptions;
  }
  else firstLine = options.firstLine;
  let _path = [...(firstLine === '/' ? [] : [firstLine]), ...path]
      ?.filter(Boolean)
      // @ts-ignore
      ?.map((path) => (Array.isArray(path) ? createPath(...path) : path)?.split('/'))
      ?.reduce((acc,path) => [...acc, ...path], [])
      ?.filter(Boolean)
      ?.join('/')
      ?.replace(/http:\/\/|http:\/|http:/, 'http://')
      ?.replace(/https:\/\/|https:\/|https:/, 'https://')
      ?.replace(/ftp:\/\/|ftp:\/|ftp:/, 'ftp://');
  let resPath = (firstLine === '/' ? firstLine : '') + (_path?.startsWith('/') ? _path?.splice(1) : _path);
  if (resPath.includes('/:') && options.regExp) {
    let ends = resPath.endsWith('/');
    if (!ends) resPath = resPath + '/';
    resPath = resPath.replace(/\/:(.*?)\//, '/(.*?)/');
    return new RegExp(resPath, 'gm');
  }
  return resPath;
}
