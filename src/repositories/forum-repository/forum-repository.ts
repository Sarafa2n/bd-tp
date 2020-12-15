import { ModelForum } from "../../models/forum/forum";
import { Response } from "../../models/response/response";
import { app } from "../../index";
import { ModelThread } from "../../models/thread/thread";
import { convertToSlug } from "../../utils/utils";

export class ForumRepository {
    static create(forum: ModelForum): Promise<Response> {
        const { title, slug, user } = forum.attrs;

        return new Promise((resolve) => {
            app.db.one('select title, nickname, slug, posts, threads from forum as frm where lower(frm.nickname) = lower($1)', [user, title])
                .then((data) => {
                    const nForum = new ModelForum({
                        title: data.title,
                        user: data.nickname,
                        slug: data.slug,
                        posts: data.posts,
                        threads: data.threads
                    });

                    resolve(new Response({ status: 409 , body: nForum.attrs }))
                })
                .catch(() => {
                    app.db.one(
                        'insert into forum (userId, slug, title, nickname)' +
                        ' select ud.id, $1, $2, ud.nickname from users as ud where lower(ud.nickname) = lower($3) returning title, nickname, slug, posts, threads', [slug, title, user])
                        .then((data) => {
                            const nForum = new ModelForum({
                                title: data.title,
                                user: data.nickname,
                                slug: data.slug,
                                posts: data.posts,
                                threads: data.threads
                            });

                            resolve(new Response({ status: 201 , body: nForum.attrs }))
                        })
                        .catch(() => {
                            resolve(new Response({ status: 404, body: { message: 'Can\'t find user' } }));
                        });
                });
        });
    }

    static thread(slugForum: string, thread: ModelThread): Promise<Response> {
        const { title, author, message, created, slug } = thread.attrs;
        let time: Date | string = new Date();
        if (created) {
           if (!(typeof created === "object"))  {
               time = created;
           }
        }
        const slugThread = slug ? slug : convertToSlug(title);

        return new Promise((resolve) => {
            app.db.one('select id, title, nickname, message, votes, slug, forumslug, created from thread  where lower(slug) = lower($1)', [slug])
                .then((data) => {
                    const nThread = new ModelThread({
                        id: data.id,
                        title: data.title,
                        author: data.nickname,
                        message: data.message,
                        votes: data.votes,
                        slug: data.slug,
                        forum: data.forumslug,
                        created: data.created,
                    });

                    resolve(new Response({ status: 409, body: nThread.attrs }));
                })
                .catch(() => {
                    app.db.one(
                        'insert into thread (title, message, slug, userId, nickname, forumId, forumSlug, created) ' +
                        'select $1, $2, $3, usr.id, usr.nickname, frm.id, frm.slug, $4 ' +
                        'from forum as frm, ' +
                        '(select id, nickname from users where nickname = $5) as usr ' +
                        'where lower(frm.slug) = lower($6) returning id, title, nickname, message, slug, votes, forumslug, created',
                        [title, message, slugThread, time, author, slugForum])
                        .then((data) => {
                            const nThread = new ModelThread({
                                id: data.id,
                                title: data.title,
                                author: data.nickname,
                                message: data.message,
                                votes: data.votes,
                                forum: data.forumslug,
                                created: data.created,
                            });

                            if (slug) {
                                nThread.attrs.slug = data.slug;
                            }

                            resolve(new Response({ status: 201, body: nThread.attrs }));
                        })
                        .catch(() => {
                            resolve(new Response({ status: 404, body: { message: 'Can\'t find user or forum' } }));
                        });
                });
        });
    }

    static details(slug: string): Promise<Response> {
        return new Promise((resolve) => {
            app.db.one('select title, nickname, slug, posts, threads from forum where slug = $1', [slug])
                .then((data) => {
                    const forum = new ModelForum({
                        title: data.title,
                        user: data.nickname,
                        slug: data.slug,
                        posts: data.posts,
                        threads: data.threads
                    });

                    resolve(new Response({ status: 200 , body: forum.attrs }))
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'Can\'t find forum' } }));
                });
        });
    }

    static getForumUser(slug: string, limit: number, since: string, desc: boolean): Promise<Response> {
        let request = 'select users.id, users.nickname collate "C" as nickname, users.fullname, users.about, users.email ' +
            'from thread join users on thread.userid = users.id where thread.forumslug = $1 ';

        const order = desc && !!desc ? 'desc' : 'asc';
        const sign = desc && !!desc ? '<' : '>';
        limit = limit ? limit : null;

        if (since) {
            request += `and users.nickname ${sign} $3 collate "C" union select users.id, users.nickname collate "C" as nickname, 
                users.fullname, users.about, users.email from post join 
                users on post.userid = users.id where users.nickname ${sign} $3 collate "C" and post.threadid in 
                (select thread.id from thread where thread.forumslug = $1) order by nickname ${order} limit $2` ;
        } else {
            request += `union select users.id, users.nickname collate "C" as nickname, users.fullname, users.about, users.email
                from post join users on post.userid = users.id where post.threadid in 
                (select thread.id from thread where thread.forumslug = $1) order by nickname ${order} limit $2`;
        }

        return new Promise((resolve) => {
            app.db.one('select id from forum where slug = $1', [slug])
                .then(() => {
                    app.db.query(request, [slug, limit, since])
                        .then((data) => {
                            resolve(new Response({ status: 200, body: data }))
                        })
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'Forum if not found' } }))
                })
        });
    }

    static getForumThreads(slug: string, limit: number, since: string, desc: boolean): Promise<Response> {
        let request = 'select id, title, nickname, forumslug, message, votes, slug, created from thread where forumslug = $1 ';

        if (since) {
            if (desc) {
                request += 'and created <= $2 ';
            } else {
                request += 'and created >= $2 ';
            }
        }

        if (desc) {
            request += 'order by created desc ';
        } else {
            request += 'order by created asc ';
        }

        if (limit > -1) {
            request += 'limit $3 ';
        }

        return new Promise((resolve) => {
            app.db.one('select id from forum where slug = $1', [slug])
                .then(() => {
                    app.db.manyOrNone(request, [slug, since, limit])
                        .then((data) => {
                            const result = data.map((item) => new ModelThread({
                                id: item.id,
                                title: item.title,
                                author: item.nickname,
                                forum: item.forumslug,
                                message: item.message,
                                votes: item.votes,
                                slug: item.slug,
                                created: item.created,
                            }));

                            resolve(new Response({ status: 200, body: result.map((item) => item.attrs) }))
                        })
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'Forum if not found' } }))
                })
        });
    }
}
