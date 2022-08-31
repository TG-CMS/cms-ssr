import { extname, relative } from 'pathe';
import path from 'path'
import escapeRE from 'escape-string-regexp'
import {encodePath} from 'ufo'
import  glob from 'glob';
import type { ResolvedConfig} from './types';
import * as fse from 'fs-extra';
export const writeRoutes = async (root:string,routes: string, name: string) => {
    await fse.ensureDir(root);
    await fse.writeFile(path.resolve(root,name), routes);
}
export function uniqueBy <T, K extends keyof T> (arr: T[], key: K) {
    const res: T[] = []
    const seen = new Set<T[K]>()
    for (const item of arr) {
        if (seen.has(item[key])) { continue }
        seen.add(item[key])
        res.push(item)
    }
    return res
}
enum SegmentParserState {
    initial,
    static,
    dynamic,
    optional,
    catchall,
}

enum SegmentTokenType {
    static,
    dynamic,
    optional,
    catchall,
}

interface SegmentToken {
    type: SegmentTokenType
    value: string
}
const PARAM_CHAR_RE = /[\w\d_.]/;
export function globFiles(rootDir:string):Promise<string[]>{
    return new Promise((resolve, reject) => {
        glob(
            `**/**/*`,
            {
                cwd: rootDir,
                nodir: true,
            },
            (err, files=[]) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(files);
                }
            },
        );
    });
};
const exclude=(file:string,excludes:string[]=[]):boolean=>{
    if (file.endsWith('css'))return false;
   return  excludes.filter((item)=>file.includes(item)).length===0;
}

function parseSegment (segment: string) {
    let state: SegmentParserState = SegmentParserState.initial
    let i = 0

    let buffer = ''
    const tokens: SegmentToken[] = []

    function consumeBuffer () {
        if (!buffer) {
            return
        }
        if (state === SegmentParserState.initial) {
            throw new Error('wrong state')
        }

        tokens.push({
            type:
                state === SegmentParserState.static
                    ? SegmentTokenType.static
                    : state === SegmentParserState.dynamic
                        ? SegmentTokenType.dynamic
                        : state === SegmentParserState.optional
                            ? SegmentTokenType.optional
                            : SegmentTokenType.catchall,
            value: buffer
        })

        buffer = ''
    }

    while (i < segment.length) {
        const c = segment[i]

        switch (state) {
            case SegmentParserState.initial:
                buffer = ''
                if (c === '[') {
                    state = SegmentParserState.dynamic
                } else {
                    i--
                    state = SegmentParserState.static
                }
                break

            case SegmentParserState.static:
                if (c === '[') {
                    consumeBuffer()
                    state = SegmentParserState.dynamic
                } else {
                    buffer += c
                }
                break

            case SegmentParserState.catchall:
            case SegmentParserState.dynamic:
            case SegmentParserState.optional:
                if (buffer === '...') {
                    buffer = ''
                    state = SegmentParserState.catchall
                }
                if (c === '[' && state === SegmentParserState.dynamic) {
                    state = SegmentParserState.optional
                }
                if (c === ']' && (state !== SegmentParserState.optional || buffer[buffer.length - 1] === ']')) {
                    if (!buffer) {
                        throw new Error('Empty param')
                    } else {
                        consumeBuffer()
                    }
                    state = SegmentParserState.initial
                } else if (PARAM_CHAR_RE.test(c)) {
                    buffer += c
                } else {
                }
                break
        }
        i++
    }

    if (state === SegmentParserState.dynamic) {
        throw new Error(`Unfinished param "${buffer}"`)
    }

    consumeBuffer()

    return tokens
}
function getRoutePath (tokens: SegmentToken[]): string {
    return tokens.reduce((path, token) => {
        return (
            path +
            (token.type === SegmentTokenType.optional
                ? `:${token.value}?`
                : token.type === SegmentTokenType.dynamic
                    ? `:${token.value}`
                    : token.type === SegmentTokenType.catchall
                        ? `:${token.value}(.*)*`
                        : encodePath(token.value))
        )
    }, '/')
}
function prepareRoutes (routes:any[], parent?: any) {
    for (const route of routes) {
        // Remove -index
        if (route.name) {
            route.name = route.name.replace(/-index$/, '')
        }

        if (parent && route.path.startsWith('/')) {
            route.path = route.path.slice(1)
        }

        if (route.children.length) {
            route.children = prepareRoutes(route.children, route)
        }

        if (route.children.find((childRoute:any) => childRoute.path === '')) {
            delete route.name
        }
    }

    return routes
}
export async function renderRoutes(dir:string){
    const pagesFolders = await globFiles(dir);
    const baseFiles=['_app.','_document.'];
    const routes:any[]=[];
    const aliasPath = `@/pages/`;
    const pages=pagesFolders.filter((item)=>exclude(item,baseFiles));
    pages.sort();
    for (let i=0;i<pages.length;i++){
        const file=pages[i];
        const  route:any={
            name: '',
            path: '',
            component: `${aliasPath}${file}`,
            children: []
        };
        let parent = routes;
        const segments = relative(dir, `${dir}/${file}`)
            .replace(new RegExp(`${escapeRE(extname(file))}$`), '')
            .split('/')


        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i]
            const tokens = parseSegment(segment)
            const segmentName = tokens.map(({ value }) => value).join('')
            const isSingleSegment = segments.length === 1

            // ex: parent/[slug].vue -> parent-slug
            route.name += (route.name && '-') + segmentName
            // ex: parent.vue + parent/child.vue
            const child = parent.find(parentRoute => parentRoute.name === route.name);
            if (child) {
                parent = child.children
                route.path = ''
            } else if (segmentName === '404' && isSingleSegment) {
                route.path += '/:catchAll(.*)*'
            } else if (segmentName === 'index' && !route.path) {
                route.path += '/'
            } else if (segmentName !== 'index') {
                route.path += getRoutePath(tokens)
            }
        }

        parent.push(route);

    }
    return prepareRoutes(routes);
}



export async function generateRouter(config:ResolvedConfig) {
     const routes = await renderRoutes(config.pages);
     const router=uniqueBy(routes, 'path');
     const isApp=await fse.pathExists(path.join(config.pages,'_app.tsx'));
     const dynamic=true;
      const re = /"path":("(.+?)")/g
    let r = `
      // The file is provisional which will be overwritten when restart;
      ${isApp?'import App from "@/pages/_app.tsx"':''}
      ${isApp?'export {App}':'export {App:null}'}
      export default ${JSON.stringify(router)}
    `;
    r = r.replace(/"component":("(.+?)")/g, (global, m1, m2) => {
         const currentWebpackChunkName =re.exec(r)![2]
        if (dynamic) {
            return `"component": ()=>import(/* webpackChunkName: "${currentWebpackChunkName}" */ '${m2.replace(/\^/g, '"')}')
        `
        } else {
            return `"component": require('${m2.replace(/\^/g, '"')}').default`
        }
    });
     await writeRoutes(config.runtimeDir,r, 'router.js')
}
