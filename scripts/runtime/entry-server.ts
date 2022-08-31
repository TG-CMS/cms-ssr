// @ts-nocheck
import type {SSRContext} from '../types';
import type {InlineConfig} from "../node";
import * as serialize  from 'serialize-javascript';
import * as queryString from 'query-string';
import * as cheerio from 'cheerio';
import {renderToString} from '@vue/server-renderer';
import {renderHeadToString,HTMLResult} from '@vueuse/head';
import {serverApp} from './main';
import * as chalk from 'chalk';
import parseurl from 'parseurl';
import {RenderContext} from "../types";

interface AppRenderContext extends HTMLResult{
  html:string;
  modules:Set,
}
export async function renderHTMLDocument(ctx:RenderContext){
  const  $ = cheerio.load(ctx.htmlTemplate, { decodeEntities: false });
  const dnsTag=(ctx.dns||[]).map((item)=>`<link rel="dns-prefetch" href="${item}">`);
  $('head').append(`
  ${ctx.headTags}
  ${dnsTag.join('\n')}
  <script type='application/javascript'>
              window.__USE_SSR__=true;
              window.__INITIAL_PINIA_DATA__=${ctx.state};
</script>
  `);
  $('body').append(ctx.bodyTags).attr(ctx.bodyAttrs);
  $('html').attr(ctx.htmlAttrs);
  $('#app').append(ctx.html);
  return $.html();

}
function logError(msg) {
  console.log(chalk.red('ERR!'), chalk.magenta(msg));
}



export async function AppRender({app,head}):AppRenderContext{
  const ctx: { teleports?: Record<string, string>; modules?: any; } = {};
  let html = await renderToString(app,ctx);
  const headTag = await renderHeadToString(head);
  if (ctx.teleports) {
    const $ = cheerio.load(html)
    for (const target in ctx.teleports) {
      const content = ctx.teleports[target];
      $(target).append(content)
    }
    html = $.html();
  };
  const modules=ctx.modules||new Set();
  return {
    html,
    modules,
    ...headTag,
  }
}
export async function serverRender(ctx:SSRContext,{htmlTemplate}){
  const req=ctx.req;
  const { search, hash, path, host } = parseurl(req);
  const url=ctx.url||path;
  const query = queryString.parse(search);
  const history = {
    query,
    url,
    host,
  };
  let error;
  let html='';
  try {
    const {app,fetchs,head,pinia,router}=await serverApp(url);
    let fetchData=[];
    const combineAysncData = Object.create(null);
    try {
      fetchData =await Promise.all(fetchs.map((fetch)=>fetch(Object.assign(ctx,{router,pinia}))));
    }catch (error) {
      logError('[SSR] fetchs ' + error.message);
      logError('[SSR] fetchs error stack: ' + error.stack);
    }
    fetchData.forEach((item)=>Object.assign(combineAysncData,item));
    const state = Object.assign(history, pinia.state.value ?? {}, combineAysncData);
    const bundleContent = await AppRender({app,head});
    html =  await renderHTMLDocument({
      htmlTemplate,
      state:serialize.default(state),
      dns:[],
      ...bundleContent
    })
  }catch (e) {
    error=e;
    logError('[SSR] html template error message: ' + error.message);
    logError('[SSR] html template error stack: ' + error.stack);
  }
  return { html, error };
};
