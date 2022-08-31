import { createApp } from 'h3';
import {start} from './scripts/start'
const app = createApp();
async function main(){
    await start();

}
main();
