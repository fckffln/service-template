import Router from "../router";
import {PathResolve} from "@shared/route/build-backend-routes";

export default Router({key: 'File Storage', pathResolver: () => PathResolve.Root, callback: (request, response, tools) => {
    return tools.tryFiles((tools) => {
        const frontendPath = tools.resolve(tools.createPath('client_modules', tools.url.pathname));
        const assetsPath = tools.resolve(tools.createPath('assets', tools.url.pathname?.match(/^\/assets|assets/)?.length ? tools.url.pathname.replace(/\/assets|assets/, '') : tools.url.pathname));
        return [frontendPath, assetsPath];
    })
}, debug: true});
