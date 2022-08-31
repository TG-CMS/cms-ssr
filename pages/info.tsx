import {defineComponent} from 'vue';
import {useHead} from "@vueuse/head";
export default defineComponent({
    setup(){
        useHead({
            title: `info`,
            htmlAttrs: {
                lang: 'zh',
            },
        });
        return ()=>(
            <div>
                info
            </div>
        )
    }
})
