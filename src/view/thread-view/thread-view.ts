import { app } from "../../index";
import { RouterStore } from "../../store/routes";
import { ThreadRepository } from "../../repositories/thread-repository/thread-repository";
import { Response } from "../../models/response/response";

export class ThreadView {
    start() {
        app.server.post(RouterStore.api.post.thread.create, (reg: any, res: any) => {
            ThreadRepository.createPost(reg.params.slug, reg.body).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.post(RouterStore.api.post.thread.update, (reg: any, res: any) => {
            ThreadRepository.updateThread(reg.params.slug, reg.body.title, reg.body.message).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.post(RouterStore.api.post.thread.vote, (reg: any, res: any) => {
            ThreadRepository.vote(reg.params.slug, reg.body.nickname, Number(reg.body.voice)).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.thread.details, (reg: any, res: any) => {
            ThreadRepository.getInfo(reg.params.slug).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.thread.posts, (reg: any, res: any) => {
            ThreadRepository.getPosts(reg.params.slug, [reg.query.limit, reg.query.since, reg.query.sort, reg.query.desc ]).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });
    }
}
