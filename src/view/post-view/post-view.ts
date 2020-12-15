import {app} from "../../index";
import {RouterStore} from "../../store/routes";
import {PostRepository} from "../../repositories/post-repository/post-repository";

export class PostView {
    start() {
        app.server.post(RouterStore.api.post.post.update, (reg: any, res: any) => {
            PostRepository.updatePost(Number(reg.params.id), reg.body.message).then((response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.post.threads, (reg: any, res: any) => {
            PostRepository.getPostDetails(Number(reg.params.id), reg.query).then((response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });
    }
}
