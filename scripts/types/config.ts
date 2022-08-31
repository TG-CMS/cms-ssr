import {AliasOptions, CSSOptions, ResolveOptions, ViteDevServer} from "vite";
export type MODE = 'development' | 'production';
export type APP='ssr'|'spa';
export interface UserConfig{
    root?: string
    base?: string
    cacheDir?: string;
    pages?:string;
    baseDir?:string,
    mode?:MODE;
    app?:APP
    define?: Record<string, any>;
    css?: CSSOptions;
    publicDir?: string | false;
    resolve?: ResolveOptions & {
        alias?: AliasOptions[]
    }
}
export type UserConfigFn = () => UserConfig | Promise<UserConfig>;
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn;
export interface InlineConfig extends UserConfig{
    isDev:boolean;
    clientOutput:string
    serverOutput:string
    clientEntry:string
    serverEntry:string;
    renderEntry:string;
    renderManifest:string;
    serverEntryFileNames:string;
    index:string;
    server:ViteDevServer;
    runtimeDir:string;
}
export type ResolvedConfig=Readonly<Required<InlineConfig>>
