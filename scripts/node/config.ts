import path from 'path';
import fse from 'fs-extra';
import {mergeConfig} from 'vite';
import {loadConfig} from 'c12';
import {DEFAULT_CONFIG_FILES} from './constants';
import {UserConfigExport, InlineConfig, ResolvedConfig, UserConfig} from '../types'
export function defineConfig(config: UserConfigExport): UserConfigExport {
    return config
};
export async function loadSSRConfig(configFile?:string,configRoot?:string){
    const root=configRoot||process.cwd();
    const configFiles:string[]=configFile?[configFile]:DEFAULT_CONFIG_FILES;
    let resolvedPath: string | undefined;
    for (const filename of configFiles) {
        const filePath = path.resolve(root, filename)
        if (!fse.existsSync(filePath)) continue;
        resolvedPath = filePath
        break
    };
    if (!resolvedPath) return {config:{},root} ;
    const {config={}}=await loadConfig({
        configFile:resolvedPath,
    });
    return  {config,configFile:resolvedPath,root};

}
export async function resolveConfig(inlineConfig: UserConfig={}  ):Promise<ResolvedConfig>{
    let config:InlineConfig =Object.create(null);
    let mode = inlineConfig.mode || "development";
    const loadResult=await loadSSRConfig('',inlineConfig.root);
    if (['production','development'].includes(mode)){
        process.env.NODE_ENV = mode;
        config.isDev = process.env.NODE_ENV !== 'production';
    };
    config.root=loadResult.root;
    config.clientOutput='dist/client';
    config.serverOutput='dist/server';
    config.clientEntry=path.join(__dirname,'../runtime/entry-client.ts');
    config.serverEntry=path.join(__dirname,'../runtime/entry-server.ts');
    config.serverEntryFileNames='ssr.server.js';
    config.index=path.join(__dirname,'../runtime/index.html');
    config.app='ssr';
    config.renderEntry=path.join(config.root,config.serverOutput,config.serverEntryFileNames);
    config.renderManifest=path.join(config.root,config.clientOutput,'ssr-manifest.json');
    config.runtimeDir=path.join(config.root,'./node_modules/.cms/');
    config=mergeConfig(loadResult.config ||{}, mergeConfig(config,inlineConfig||{})) as InlineConfig;
    return  Object.assign({
        publicDir:path.join(loadResult.root,'public'),
        base:'/',
        baseDir:'',
        pages:path.join(loadResult.root,config.baseDir||'','pages'),
    },config) as ResolvedConfig;

}
