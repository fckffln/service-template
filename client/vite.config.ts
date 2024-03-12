import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteSvgr from 'vite-plugin-svgr';
import mkcert from 'vite-plugin-mkcert';
import environment from '../environments';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig((() => {
	return {
		esbuild: {
			loader: 'tsx',
		},
		optimizeDeps: {
			esbuildOptions: {
				loader: {
					'.js': 'jsx',
					'.ts': 'tsx',
				},
			},
		},
		base: '/',
		publicDir: '../assets',
		plugins: [
			tsconfigPaths(),
			react() as any,
			viteSvgr(),
			environment?.ssl ? mkcert() : undefined,
		],
		server: {
			https: environment?.ssl ?? false,
			port: environment?.port ?? 3001,
			host: environment?.host ?? '0.0.0.0',
			proxy: {
				'/api/internal': {
					secure: false,
					target: environment?.internalApi,
					changeOrigin: true,
				},
				'/api/external': {
					secure: false,
					target: environment?.externalApi,
					changeOrigin: true,
				},
			},
		},
		build: {
			chunkSizeWarningLimit: 5000,
			emptyOutDir: true,
			outDir: '../client_modules'
		},
	};
}) as any);
