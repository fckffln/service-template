import {FrontendSharedRoute as f} from './build-frontend-routes';
import {BackendSharedRoute as b} from './build-backend-routes';

export type BackendSharedRoute = b;
export type FrontendSharedRoute = f;

export type SharedRoute = {
    key: string;
    path: string;
    children?: SharedRoute[];
}

export const sharedRoutes = [
    {
        key: 'main',
        path: '/',
    }
];
