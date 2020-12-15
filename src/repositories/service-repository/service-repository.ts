import { app } from "../../index";
import { Response } from "../../models/response/response";

export class ServiceRepository {
    static delete(): Promise<Response> {
        return new Promise ((resolve) => {
            app.db.none('TRUNCATE vote, post, thread, forum, users RESTART IDENTITY CASCADE')
                .then(() => {
                    resolve(new Response({ status: 200 }));
                });
        });
    }

    static info(): Promise<Response> {
        return new Promise( (resolve) => {
            app.db.oneOrNone('select count(id) as c_forum, sum(posts) as c_post, sum(threads) as c_threads from forum')
                .then((forums) => {
                   app.db.one('select count(id) as c_user from users')
                       .then((users) => {
                           resolve(new Response({
                               status: 200,
                               body: {
                                   user: Number(users.c_user),
                                   forum: Number(forums.c_forum),
                                   thread: Number(forums.c_threads),
                                   post: Number(forums.c_post)
                               }
                           }));
                       })
                });
        });
    }
}
