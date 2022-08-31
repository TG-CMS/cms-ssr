import {defineComponent} from 'vue';
import {useHead} from '@vueuse/head';
import './style.css';
export async function getServerSideProps(){
  return {
      aa:9999,
  }
}
export default defineComponent({
        async getServerSideProps({store,router}){
           return {
               aa:'000'
           }
        },
       props:{
           aa:Number,
       },
    setup(props){
        useHead({
            title: `hello`,
            htmlAttrs: {
                lang: 'zh',
            },
            meta: [
                {
                    name: 'description',
                    content: 'desc',
                },
                {
                    name: 'description',
                    content: 'desc 2',
                },
                {
                    property: 'og:locale:alternate',
                    content: 'fr',
                    key: 'fr',
                },
                {
                    property: 'og:locale:alternate',
                    content: 'zh',
                    key: 'zh',
                },
            ],
        });
        return ()=>(
            <div>
                {/*<Search/>*/}
                index
            </div>
        )
    }
})
