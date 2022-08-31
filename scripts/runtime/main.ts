// @ts-nocheck
import { createRouter as create, createWebHistory, createMemoryHistory } from 'vue-router';
import { createHead } from '@vueuse/head';
import { createSchemaOrg, useVueUseHead } from '@vueuse/schema-org';
import FeRoutes from '@runtime/router';
import BaseApp from '@/pages/_app';
import {Component, createSSRApp} from "vue";
import {createPinia} from "pinia";
export  function getFetchs (component:Component[]):Promise[]{
    const fetchs=component.filter((route)=>{
        const getServerSideProps=route.components?.getServerSideProps||route.components.default?.getServerSideProps
        return typeof getServerSideProps === 'function';
    }).map((route)=>route.components?.getServerSideProps||route.components.default?.getServerSideProps);
    const getServer=BaseApp.getServerSideProps;
    if(getServer){
        fetchs.push(getServer)
    };
    return fetchs
}
export interface VueRouterOptions {
    base?: string
}
export function createRouter (options: VueRouterOptions&{hashRouter: boolean} = {}) {
    const base = options.base ?? '/';
    return create({
        history: import.meta.env.SSR ? createMemoryHistory():createWebHistory(base),
        routes: FeRoutes
    });
};
export function createSSRHead(){
    return createHead();
}
export async function serverApp(url:string){
    const app = createSSRApp(BaseApp);
    const head = createSSRHead();
    const router = createRouter()
    const pinia = createPinia();
    const schemaOrg = createSchemaOrg({
        head,
        canonicalHost: 'https://example.com',
        provider: {
            useRoute: () => router.currentRoute,
            setupDOM: useVueUseHead(head)
        }
    });
    app.use(router)
    app.use(head);
    app.use(pinia);
    schemaOrg.setupDOM();
    await router.push(url);
    await router.isReady();
    const fetchs=getFetchs(router.currentRoute.value.matched);
    const isMatched=router.currentRoute.value.matched.length>0;
    return {
        app,
        fetchs,
        head,
        pinia,
        router,
        isMatched,
    }
};
export {BaseApp, FeRoutes};

