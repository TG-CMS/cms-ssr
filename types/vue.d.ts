import {ParamsNest} from '../scripts/types';
declare module '@vue/runtime-core' {
    export interface ComponentCustomOptions {
        getServerSideProps?: (option: ParamsNest) => Promise<object | void> | object | void;
    }
    export interface ComponentCustomProperties {
        getServerSideProps?: (option: ParamsNest) => Promise<object | void> | object | void;
    }
}
declare module "*.vue" {
    import type { DefineComponent } from "vue";
    const component: DefineComponent<{}, {}, any>;
    export default component;
}
