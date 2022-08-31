import type { ViteDevServer, Plugin } from 'vite';
import { template as templateComplier, set } from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import cheerio from 'cheerio';

function formatPath(pathStr: string): string {
  return process.platform === 'win32' ? pathStr.split(path.sep).join('/') : pathStr;
}

interface GetHtmlContent{
  template:string;
  entry:string;
  templateParameters:Record<any, any>,

}
const getHtmlContent = ({
  template,
  entry,
  templateParameters
}:GetHtmlContent) => {
  let html = fs.readFileSync(template, 'utf-8');
  if (templateParameters) {
    const compiled = templateComplier(html);
    try {
      html = compiled(templateParameters);
    } catch (e) {
      console.log('');
    }
  }
  const $ = cheerio.load(html);
  if (process.env.NODE_ENV !== 'production'){
    $('body').append(`<script type="module" src="/@vite/client" />`);
  }
  $('body').append(`<script type="module" src="${entry}" />`);


  return $.html({});
};

interface Option {
  filename: string
  template: string
  entry: string
  root: string
  templateParameters?: object
  ssr?: boolean;
  command?: string;
  isDev:boolean
}

export const HtmlPlugin = ({ filename, template, entry, root, templateParameters = {}, ssr,isDev }: Option): Plugin => {
  const pageName = filename.replace('.html', '');

  const getEntry = () => {
    let entryPath: string = entry;
    if (entry.includes(root)) {
      entryPath = path.relative(root, entry);
    }

    return `/${entryPath}`;
  };

  const html = getHtmlContent({
    entry: getEntry(),
    template,
    templateParameters,
  });
  // vite will get relative path by `path.posix.relative(config.root, id)`
  // path.posix.relative will get error path when pass relative path of index html
  const absoluteHtmlPath = formatPath(path.join(root, filename));
  const plugin: Plugin = {
    name: `vite-plugin-html-${pageName}`,
    enforce: 'pre',
    config(cfg) {
      // @ts-ignore
      cfg.build = set(cfg.build, `rollupOptions.input.${pageName}`, absoluteHtmlPath);
    },
    resolveId(id) {
      if (id.includes('.html')) {
        return formatPath(id);
      }
      return null;
    },
    load(id) {
      if (formatPath(id) === absoluteHtmlPath) {
        return html;
      }
      return null;
    },
    configureServer(server: ViteDevServer) {
      if (!ssr) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            console.log(req.url ,'req.url')
            if (!req.url?.endsWith('.html') && req.url !== '/') {
              return next();
            }

            if (req.url === `/${filename}`) {
              try {
                res.setHeader('Content-Type','text/html');
                res.end(await server.transformIndexHtml(req.url, html));
              } catch (e) {
                return next(e);
              }
            }

            next();
          });
        };
      }
    }
  };
  // ssr 在 dev 阶段由中间件进行 html 返回
  if (ssr&&isDev) {
    plugin.transformIndexHtml = () => {
      return html;
    };
  }
  return plugin;
};
