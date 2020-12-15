import { app } from "../../index";
import { RouterStore } from "../../store/routes";
import { ForumRepository } from "../../repositories/forum-repository/forum-repository";
import { IForum, ModelForum } from "../../models/forum/forum";
import { Response } from "../../models/response/response";
import { IThread, ModelThread } from "../../models/thread/thread";


export class ForumView {
    start() {
        app.server.post(RouterStore.api.post.forum.create, (reg: any, res: any) => {
            const data: IForum = {
                title: reg.body.title,
                user: reg.body.user,
                slug: reg.body.slug,
            };

            const forum = new ModelForum(data);
            ForumRepository.create(forum).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.post(RouterStore.api.post.forum.createThread, (reg: any, res: any) => {
            const thread = new ModelThread(reg.body);

            ForumRepository.thread(reg.params.slug, thread).then((response: Response) => {
               res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.forum.details, (reg: any, res: any) => {
            ForumRepository.details(reg.params.slug).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.forum.users, (reg: any, res: any) => {
            const desc = reg.query.desc === 'true';

            ForumRepository.getForumUser(reg.params.slug, Number(reg.query.limit), reg.query.since, desc).then((response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.forum.threads, (reg: any, res: any) => {
            const desc = reg.query.desc === 'true';

            ForumRepository.getForumThreads(reg.params.slug, Number(reg.query.limit), reg.query.since, desc).then((response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });
    }
}
