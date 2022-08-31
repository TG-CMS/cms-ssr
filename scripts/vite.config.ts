import { build, UserConfig,mergeConfig ,splitVendorChunkPlugin} from 'vite';
import chalk from 'chalk'
import vuePlugin from '@vitejs/plugin-vue'
import vueJSXPlugin from '@vitejs/plugin-vue-jsx';
import legacy from '@vitejs/plugin-legacy';
import viteCompression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';
import babel from '@rollup/plugin-babel';
import {resolveConfig} from './node';
import {InlineConfig,ResolvedConfig} from './types';
import {HtmlPlugin,CacheDirPlugin, VitePluginSSR} from './plugin';
import path from "path";
const getAlias=(confg:InlineConfig)=>{
    const {isDev}=confg;
    return {
        "@":confg.root,
        "@runtime":confg.runtimeDir,
        '@vue/reactivity': require.resolve(`@vue/reactivity/dist/reactivity.cjs${isDev ? '' : '.prod'}.js`),
        '@vue/shared': require.resolve(`@vue/shared/dist/shared.cjs${isDev ? '' : '.prod'}.js`),
        'vue-router':require.resolve(`vue-router/dist/vue-router.cjs${isDev ? '' : '.prod'}.js`),
        'vue/server-renderer':require.resolve('vue/server-renderer'),
        'vue/compiler-sfc':require.resolve('vue/compiler-sfc'),
        vue: require.resolve(`vue/dist/vue.cjs${isDev ? '' : '.prod'}.js`)
    }
}
export function serverConfig(confg:InlineConfig):UserConfig{
    const {serverEntry,serverOutput,clientEntry,serverEntryFileNames,isDev,publicDir,root}=confg as ResolvedConfig;
  return  {
      root,
      logLevel:isDev?'info':'warn',
      plugins:[
          vuePlugin(),
          vueJSXPlugin(),
          HtmlPlugin({
              entry:clientEntry,
              filename:'index.html',
              ssr:true,
              template: path.resolve(publicDir||'', 'index.html'),
              isDev,
              root,
          }),
           VitePluginSSR(confg),
          CacheDirPlugin(root,'server'),
      ],
      resolve:mergeConfig(
          {
              alias:getAlias(confg),
              extensions: ['.mjs','.vue', '.js', '.ts', '.jsx', '.tsx', '.json']
          },
          confg.resolve??{},
      ),
      server:{
          hmr:{
              protocol:'ws'
          },
          watch:{
              usePolling: true,
              interval: 100
          }
      },
      build:{
          ssr: serverEntry,
          outDir:serverOutput,
          manifest:true,
          rollupOptions:{
              external:  ['vue', 'vue-router'],
              input:isDev?clientEntry:serverEntry,
              output: {

                  entryFileNames: serverEntryFileNames,
                  format: 'cjs',
                  inlineDynamicImports: false,
                  preferConst: true,

              },
              onwarn (warning, rollupWarn) {
                  if (!['UNUSED_EXTERNAL_IMPORT'].includes(warning.code||'')) {
                      rollupWarn(warning)
                  }
              }

          }
      },
      define:{
          __isBrowser__: false,
          'process.server': true,
          'process.client': false,
          'typeof window': '"undefined"',
          'typeof document': '"undefined"',
          'typeof navigator': '"undefined"',
          'typeof location': '"undefined"',
          'typeof XMLHttpRequest': '"undefined"'
      },
      ssr:{
          external: [
              "vue",
              'serialize-javascript',
              "path-to-regexp",
              "@vueuse/head",
              'vue-router'
          ],
          noExternal: [
              /\/esm\/.*\.js$/,
              /\.(es|esm|esm-browser|esm-bundler).js$/,
              /\.(css|less|sass|scss)$/,
              /vant.*?style/,
              /antd.*?(style)/,
              /ant-design-vue.*?(style)/,
              /vue-jsx-ssr$/,
              // /\.(vue)$/
          ]

      },
      optimizeDeps: {
          include: ['vue', 'vue-router', '@vueuse/head'],
      },
  }
};
export function clientConfig(confg:InlineConfig):UserConfig{
    const {clientEntry,clientOutput,isDev,publicDir,root}=confg as ResolvedConfig;
  return  {
      logLevel:isDev?'info':'warn',
      plugins:[
          vuePlugin(),
          vueJSXPlugin(),
          legacy({
              targets: ['defaults', 'not IE 11'],
          }),
          viteCompression({verbose:false}),
          VitePWA(),
          HtmlPlugin({
              entry:clientEntry,
              filename:'index.html',
              ssr:false,
              template: path.resolve(publicDir||'', 'index.html'),
              isDev,
              root,
          }),
          splitVendorChunkPlugin(),
          CacheDirPlugin(root,'client'),
      ],
      root,
      resolve:mergeConfig(
          {
              alias:getAlias(confg),
              extensions: ['.mjs','.vue', '.js', '.ts', '.jsx', '.tsx', '.json']
          },
          confg.resolve??{},
      ),
      build:{
          outDir:clientOutput,
          manifest:true,
          cssCodeSplit:false,
          ssrManifest:true,
          rollupOptions:{
              input:{
                  'client-entry':clientEntry,
              },
              output:{
                  assetFileNames:'[ext]/[name].[hash][extname]',
                  entryFileNames: 'js/[name]-[hash].js',
                  chunkFileNames:"js/[name].[hash].js",
                  compact: true,
              }
          },
          // target:[
          //   "es2016"
          // ]
      },
      define:{
          __isBrowser__: true,
          'process.server': false,
          'process.client': true,
      }
  }
}
export const viteBuild = async () => {
    const start = Date.now()
     console.log(chalk.blue('Building server...'))
     const config= await resolveConfig({ mode: 'production',});
     await Promise.all([
            build({ ...clientConfig(config), mode: 'production', configFile:false, }),
            build({ ...serverConfig(config), mode: 'production', configFile:false, })
     ]);
    console.log(chalk.green(`Server built in ${(Date.now() - start)/1000}s`) )
}
export const viteServerBuild= async ()=>{
    const config= await resolveConfig({ mode: 'production',});
    await build({ ...serverConfig(config), mode: 'production', configFile:false, })
}
