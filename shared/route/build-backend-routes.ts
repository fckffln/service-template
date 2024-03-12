import {SharedRoute, sharedRoutes} from "./index";

export enum PathResolve {
    Disabled = -1,
    Root = 0,
    Child = 1
}

export type BackendSharedRoute = {
    pathResolution: (url: URL) => PathResolve;
    listener?: (request: Request, response: typeof Response, ...args: any[]) => Promise<any> | any | Promise<void> | void;
    debug?: boolean;
} & Omit<SharedRoute, 'children'>;

export default (routeFactory: (router: SharedRoute) => BackendSharedRoute) => {
    return sharedRoutes.map((route) => routeFactory(route));
}
