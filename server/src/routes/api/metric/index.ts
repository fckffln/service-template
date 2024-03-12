import {Router} from "@lib/bun";
import {PathResolve} from "@shared/route/build-backend-routes";

const date = new Date();

export default Router({
    key: 'API Metrics',
    pathResolver: (url) => url.pathname === '/api/v1/metric' ? PathResolve.Root : PathResolve.Disabled,
    callback: async (request, response, tools) => {
        return new response(JSON.stringify({
            runtime: new Date().getTime() - date.getTime(),
            cookies: tools.cookies
        }), {headers: {'Content-type': 'application/json'}})
    }, debug: true})
