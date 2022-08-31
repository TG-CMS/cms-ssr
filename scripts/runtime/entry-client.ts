// @ts-nocheck
import {  createSSRApp, createApp } from 'vue';
import { createPinia } from 'pinia'
import {createRouter,createSSRHead, BaseApp} from './main';
import {SSRINJECT} from './_document';
export async function entryClient(){
    const router = createRouter({
        base: '/',
        hashRouter: false,
    });
    const head= createSSRHead()
    const pinia = createPinia();
    const create = window.__USE_SSR__ ? createApp:createSSRApp ;
    const rootProps=window.__INITIAL_PINIA_DATA__||{};
    if (window.__INITIAL_PINIA_DATA__) {
        pinia.state.value = window.__INITIAL_PINIA_DATA__
    }
    const app = create(BaseApp,rootProps);
    app.use(head);
    app.provide(SSRINJECT,rootProps);
    app.use(router)
    app.use(pinia)
    await router.isReady();
    app.mount('#app', true) // judge ssr/csr
}
entryClient();
