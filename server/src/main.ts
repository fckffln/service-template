import {createServer} from "@lib/bun";
import environment from '@environments';
import frontendRouter from "./routes/frontend";
import apiRouter from "./routes/api";


createServer({
    port: environment?.port ?? 3001,
    host: environment?.host ?? '0.0.0.0',
    mode: environment?.mode,
    ssl: environment?.ssl,
    routers: [
        frontendRouter,
        apiRouter,
    ],
});
