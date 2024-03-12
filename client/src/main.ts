import React from 'react';
import {createRoot} from "react-dom/client";
import App from './app';
import buildFrontendRoutes from "@shared/route/build-frontend-routes";

const routes = buildFrontendRoutes((route) => {
   switch (route.key) {
       case 'main':
           return {
               ...route,
               element: () => import('./app/pages/main').then((page) => page.default),
               children: [],
           };
   }
});

const root = document.getElementById('root');
const Root = createRoot(root);
Root.render(App({routes}));
