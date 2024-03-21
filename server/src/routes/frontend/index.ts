import { createPath, Router, RouterController } from "@lib/bun";
import buildBackendRoutes, { PathResolve } from "@shared/route/build-backend-routes";
import {BackendSharedRoute, SharedRoute} from "@shared/route";

const routeFactory = (route: SharedRoute, parentPathname = undefined): BackendSharedRoute => {
    if (route?.children?.length) {
        route.children = route.children.map((_route) => routeFactory(_route, route.path)) as any;
    }
    switch (route.key) {
        default:
            return {
                path: createPath({firstLine: '/', regExp: false}, parentPathname, route.path) as string,
                key: route.key,
                pathResolution: (url) => {
                    const path = createPath('/', parentPathname, route.path);
                    if (path instanceof RegExp && typeof path !== 'string') {
                        const pathname = url.pathname.endsWith('/') ? url.pathname : url.pathname + '/';
                        const match = pathname.match(path);
                        if (!match?.length) return PathResolve.Disabled;
                        return match[0] === pathname ? PathResolve.Root : PathResolve.Disabled;
                    }
                    return (url.pathname === path || url.pathname === (path + '/')) ? PathResolve.Root : PathResolve.Disabled;
                },
                listener: (request, response, tools) => {
                    return tools.tryFiles(() => [tools.resolve(tools. createPath('client_modules', 'index.html'))]);
                },
                children: route.children as BackendSharedRoute[],
            }
    }
};

const routerFactory = (request, response, parentRouter = undefined) => (route) => {
    if (!route?.children?.length)
        return Router({key: `Frontend - ${parentRouter ? `${parentRouter.key} - ` : ''}${route.key}`, pathResolver: route.pathResolution, callback: route.listener, debug: true});
    return Router({
        key: 'Frontend',
        pathResolver: () => PathResolve.Child,
        callback: async (request, response, tools) => {
            return RouterController(request, response)(...route.children.map(routerFactory(request, response, route)))
        }, debug: false});
};

const routes = buildBackendRoutes(routeFactory);

export default Router({
    key: 'Frontend',
    pathResolver: () => PathResolve.Child,
    callback: async (request, response, tools) => {
        return RouterController(request, response)(...routes.map(routerFactory(request, response)))
    }, debug: false})
