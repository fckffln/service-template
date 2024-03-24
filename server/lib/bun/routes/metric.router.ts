import Router, {createPath, RouterController} from "../router";
import {PathResolve} from "@shared/route/build-backend-routes";
import environment from "@environments";
import {ClientMetricData} from "@shared/types/metric";
import {getClientMetricDataByServer, sendToMetricStore} from "@lib/bun/metric";
import {Code, File} from '@lib/package';

const ClientMetricRouter = (type: 'public' | 'internal') => Router({key: 'Client', pathResolver: (url) => url.pathname === createPath('/', environment[type + 'Api'], 'metric', 'client') ? PathResolve.Root : PathResolve.Disabled, callback: async (request, response, tools) => {
        if (request.method === 'POST' && type === 'public') {
            const metricData: ClientMetricData = await request.json() as any;
            sendToMetricStore(metricData);
            return new response(JSON.stringify({
                result: true,
            }), {headers: {'Content-type': 'application/json'}});
        }
        else if (request.method === 'GET' && type === 'internal') {
            return new response(JSON.stringify({
                result: getClientMetricDataByServer(),
            }), {headers: {'Content-type': 'application/json'}});
        }
    }, debug: true});

const ViewMetricRouter = Router({key: 'Client View', pathResolver: (url) => url.pathname === createPath('/', environment.internalApi, 'metric', 'view') ? PathResolve.Root : PathResolve.Disabled, callback: async (request, response, tools) => {
        if (request.method === 'GET') {
            let html = new File('assets/views/metric/index.html').read().toString();
            let js = new Code('assets/views/metric/main.ts').build();
            js = `window.exports={};window.metricPath='${createPath("/", environment.internalApi, 'metric', 'client')}';` + js;
            html = html.replace('// script replacement', js);
            return new response(html, {headers: {'Content-Type': 'text/html'}});
        }
}, debug: true});

const InternalRouter = Router({key: 'Internal', pathResolver: (url) => url.pathname.startsWith(createPath('/', environment.internalApi, 'metric') as string) ? PathResolve.Child : PathResolve.Disabled, callback: async (request, response, tools) => {
    return RouterController(request, response)(ClientMetricRouter('internal'), ViewMetricRouter);
}});
const PublicRouter = Router({key: 'Public', pathResolver: (url) => url.pathname.startsWith(createPath('/', environment.publicApi, 'metric') as string) ? PathResolve.Child : PathResolve.Disabled, callback: async (request, response, tools) => {
    return RouterController(request, response)(ClientMetricRouter('public'));
}});

export default Router({
    key: 'Metric',
    pathResolver: (url) =>
        url.pathname.startsWith(createPath('/', environment.internalApi, 'metric') as string) ||
        url.pathname.startsWith(createPath('/', environment.publicApi, 'metric') as string) ?
            PathResolve.Child : PathResolve.Disabled,
    callback: async (request, response, tools) => {
        return RouterController(request, response)(InternalRouter, PublicRouter);
    },
});
