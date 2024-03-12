import {Router, RouterController} from "@lib/bun";
import {PathResolve} from "@shared/route/build-backend-routes";
import metricRouter from './metric';

export default Router({
    key: 'API',
    pathResolver: () => PathResolve.Child,
    callback: async (request, response, tools) => {
        return RouterController(request, response)(
            metricRouter
        )
    }})
