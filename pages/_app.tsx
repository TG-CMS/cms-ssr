import {defineComponent,VNode,createVNode,useAttrs} from 'vue';
import {RouterView,RouteLocationNormalizedLoaded,} from 'vue-router';
export default defineComponent({
    async getServerSideProps(){
        return {
            test:'',
        }
    },
    setup(){
        const pageProps=useAttrs();
        return ()=>(
            <div>
                <RouterView
                    v-slots={{
                        default: ({
                                      Component,
                                  }: {
                            Component: VNode;
                            route: RouteLocationNormalizedLoaded;
                        }) => (
                            Component && createVNode(Component,pageProps)
                        ),
                    }}

                />
            </div>
        )
    }
})
