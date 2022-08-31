import type { ViteDevServer ,Plugin} from 'vite';
import type { NextHandleFunction } from 'connect';
import {InlineConfig} from "../types";

const createSSRDevHandler = (server: ViteDevServer, serverEntry:string): NextHandleFunction => {
    const requestHandler: NextHandleFunction = async (req, res, next) => {
        // just do some filter already known
        console.log(req.originalUrl ,'req.originalUrl ')
        if (req.method !== 'GET' || req.originalUrl === '/favicon.ico') {
            return next();
        }
        let htmlTemplate: string;
        try {
            // html content will be provided by vite-plugin-html
            htmlTemplate = await server.transformIndexHtml(req.originalUrl||'/', '');
        } catch (err:any) {
            server.ssrFixStacktrace(err);
            // fallback
            return next(err);
        }
        try {
            const {serverRender} = await server.ssrLoadModule(serverEntry);
            const url = req.url;
            req.url = req.originalUrl;
            const { error, html, redirectUrl } = await serverRender({ req, res }, { htmlTemplate});
            req.url = url;
            if (error) {
                server.ssrFixStacktrace(error as Error);
            }
            console.log('[SSR] ssr html content', url, req.originalUrl);
            res.setHeader('Content-Type', 'text/html');
            res.end(html)
        } catch (err:any) {
            server.ssrFixStacktrace(err);
        }
    };

    return requestHandler;
};
export const VitePluginSSR = (options:InlineConfig): Plugin => {
    return {
        name: 'vite-plugin-ssr',
        enforce: 'pre',
        configureServer: async (server) => {
            const handler = createSSRDevHandler(server, options.serverEntry);
            return () => server.middlewares.use(handler);
        },
    }
}
