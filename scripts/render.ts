import type {ViteDevServer} from 'vite';
import {renderToString} from '@vue/server-renderer';
import {renderHeadToString} from '@vueuse/head';
import type { SSRContext,ResolvedConfig} from './types';
import {generateRouter} from './generate.router'
import {InlineConfig} from "./types";
let _viteServer:ViteDevServer;
export async function createViteServer(config:ResolvedConfig) {
    const {createServer} = await import('vite');
    const {serverConfig} = await import('./vite.config');
    const server=_viteServer = await createServer({
        ...serverConfig(config),
        configFile: false,
    });
    // @ts-ignore
    config.server=server;
    await generateRouter(config)
    server.watcher.on('all',async (name,file)=>{
        if (file.includes(config.pages)&&['add', 'unlink'].includes(name)){
          await generateRouter(config)
        };
    })
    return server;
};


export function lazyCachedFunction <T> (fn: () => Promise<T>): () => Promise<T> {
    let res: Promise<T> | null = null
    return () => {
        if (res === null) {
            res = fn().catch((err) => { res = null; throw err })
        }
        return res
    }
}
export async function getManifest(config:InlineConfig){
    let manifest = {};
    if (config.isDev) return manifest;
    try {
        manifest = require(config.renderManifest);
    }catch (e) {
        console.warn(e);
    }
    return manifest;
};
export function renderPreloadLink(file:string) {
    if (file.endsWith(".js")) {
        return `<link rel="modulepreload" crossorigin href="${file}">`;
    } else if (file.endsWith(".css")) {
        return `<link rel="stylesheet" href="${file}">`;
    } else {
        return "";
    }
};
export function renderPreloadLinks(modules:Record<any, any>, manifest:Record<any, any>={}) {
    let links = "";
    if (!modules)return links;
    const seen = new Set();
    modules.forEach((id:string) => {
        const files = manifest[id];
        if (files) {
            files.forEach((file:string) => {
                if (!seen.has(file)) {
                    seen.add(file);
                    links += renderPreloadLink(file);
                }
            });
        }
    });
    return links;
};
export async function proRender(ctx: SSRContext, config: ResolvedConfig) {
    const {serverRender} = require(config.renderEntry)
    return  await serverRender(ctx, config);
};
const getSSR=lazyCachedFunction(async ()=>{

})
export async function render(ctx: SSRContext,config: ResolvedConfig) {
    const serverRes =  await proRender(ctx, config);
    const context: {
        teleports?: Record<string, string>
        modules?: any
    } = {}
    let html = await renderToString(serverRes, context);
    const headTag= renderHeadToString(ctx.head);
    const manifest=await getManifest(config);
};
