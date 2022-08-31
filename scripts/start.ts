import {createViteServer,render} from "./render";
import {resolveConfig} from './node';
export async function start(){
    const {listen}=await import('listhen');
    const config=await resolveConfig({mode:'development'});
     let server = await createViteServer(config);
     await server.listen(3000)
     server.printUrls();
    // app.use(server.middlewares);
    // await listen(app, {
    //     showURL: true,
    //     clipboard: true,
    //     open: false,
    //     port:  process.env.CMS_PORT||3000,
    //     hostname: process.env.CMS_HOST,
    // });

}
