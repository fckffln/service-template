import {SharedRoute, sharedRoutes} from "./index";
import clone from "../data/clone";

export enum PathResolve {
    Disabled = -1,
    Root = 0,
    Child = 1
}

export type BackendSharedRoute = {
    pathResolution: (url: URL) => PathResolve;
    listener?: (request: Request, response: typeof Response, ...args: any[]) => Promise<any> | any | Promise<void> | void;
    debug?: boolean;
    children?: BackendSharedRoute[];
} & Omit<SharedRoute, 'children'>;

export default (routeFactory: (router: SharedRoute) => BackendSharedRoute) => {
    return clone(sharedRoutes).map((route) => routeFactory(route));
}
