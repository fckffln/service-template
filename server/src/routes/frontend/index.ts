import {Router, RouterController} from "@lib/bun";
import buildBackendRoutes, {PathResolve} from "@shared/route/build-backend-routes";

export default Router({
    key: 'Frontend',
    pathResolver: () => PathResolve.Child,
    callback: async (request, response, tools) => {
        return RouterController(request, response)(...buildBackendRoutes((route) => {
        switch (route.key) {
            default:
                return {
                    path: route.path,
                    key: route.key,
                    pathResolution: (url) => {
                        return (url.pathname === route.path || url.pathname === route.path + '/') ? PathResolve.Root : PathResolve.Disabled;
                    },
                    listener: (request, response, tools) => {
                        return tools.tryFiles(() => [tools.resolve(tools. createPath('client_modules', 'index.html'))]);
                    }
                }
        }
    }).map((route) => Router({key: `Frontend - ${route.key}`, pathResolver: route.pathResolution, callback: route.listener, debug: true})))
    }, debug: true})
