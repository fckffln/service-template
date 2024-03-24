import Router, {createPath} from "../router";
import {PathResolve} from "@shared/route/build-backend-routes";
import {Package} from "@lib/package";
import environment from "@environments";

export default Router({key: 'Code Push', pathResolver: (url) => url.pathname === createPath('/', environment.internalApi, '/code-push') ? PathResolve.Root : PathResolve.Disabled, callback: async (request, response, tools) => {
        if (request.method === 'POST' && request.headers.get('secret') === environment.secret) {
            const pack = new Package(`temp/code-push/input/${new Date().getTime()}.zip`);
            pack.write(await request.arrayBuffer());
            pack.extract(request.headers.get('to') ?? 'temp/code-push/output', {force: request.headers.has('force') ? request.headers.get('force') === 'true' : false});
            return new response(JSON.stringify({
                result: pack
            }), {headers: {'Content-type': 'application/json'}});
        }
    }, debug: true});
