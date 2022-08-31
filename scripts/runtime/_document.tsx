import {defineComponent,Fragment,inject} from 'vue';
import {BaseApp} from './main';
import { HeadTag} from '@vueuse/head';
export const SSRINJECT=Symbol("SSRINJECT");
export interface SSRContext{
    __INITIAL_PINIA_DATA__:string
    headTags:HeadTag
}
function useContext():SSRContext{
    return inject<SSRContext>(SSRINJECT) as SSRContext;
}
const SSRScript=defineComponent({
    setup(){
        const isDev=process.env.NODE_ENV !== 'production';
        const {__INITIAL_PINIA_DATA__}=useContext();
        const rederDEV=()=>(
            <Fragment>
                <script type="module" src="/@vite/client"/>
                <script type="module" src="/scripts/runtime/entry-client.ts"/>
            </Fragment>
        );
        const renderData=()=>(
            <script type='application/javascript' innerHTML={`window.__USE_SSR__=true;window.__INITIAL_PINIA_DATA__=${__INITIAL_PINIA_DATA__};`}/>
        )
        return ()=>(
            <Fragment>
                {
                    renderData()
                }
                {
                    isDev&&rederDEV()
                }
            </Fragment>
        )
    }
});
export default defineComponent({
    setup(props){

        return ()=>(
           <Fragment>
               <div id="app">
                   <BaseApp/>
               </div>
               <SSRScript/>
           </Fragment>
        )
    }
})
