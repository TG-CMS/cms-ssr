import type { Request, Response } from 'express'
import type {FastifyRequest,FastifyReply} from 'fastify';
import type { Pinia } from 'pinia';
import type {RouteLocationNormalizedLoaded} from 'vue-router';
import type {H3Event} from 'h3';
import type {HeadClient} from '@vueuse/head';
export interface BaseContext{
    head:HeadClient;
    url:string;
    query?:Record<any, any>,

}
export interface ExpressContext extends BaseContext{
    req: Request
    res: Response
}

export interface FastifyContext extends BaseContext{
    req: FastifyRequest
    res: FastifyReply
}
export type SSRNestContext<T=any> = ExpressContext & T;
export type SSRFastifyContext<T=any> = FastifyContext & T;
export type SSRH3Context<T=any>=H3Event&T
export type SSRContext<T=any> = SSRNestContext<T>|SSRFastifyContext<T> | SSRH3Context<T>;
export interface ParamsNest<T=any, U=any> extends SSRContext {
    store: Pinia
    router: RouteLocationNormalizedLoaded
}
export interface RenderContext{
    html:string;
    headTags: string;
    htmlAttrs: string;
    bodyAttrs: string;
    bodyTags: string;
    preloadLinks?:string;
    htmlTemplate:string
    state:string;
    dns:string[];
    [key:string]:any
}
