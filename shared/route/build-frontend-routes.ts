import {SharedRoute, sharedRoutes} from "./index";

type RouteWithoutChildren = Omit<SharedRoute, 'children'>;

export type FrontendSharedRoute = RouteWithoutChildren & {
    element: () => Promise<any>;
    children?: FrontendSharedRoute[];
};

export default (routeFactory: (router: SharedRoute) => FrontendSharedRoute) => {
    return sharedRoutes.map((route) => routeFactory(route));
}
