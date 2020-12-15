import { Response } from "../../models/response/response";
import {app} from "../../index"
import {pgp} from "../../app/app";

export class ThreadRepository {
    static createPost(slug: any, posts: any[]): Promise<Response> {
        return new Promise((resolve) => {
            const treadReguest = `select id, slug, forumslug, forumid from thread where lower(slug) = lower($1) or id::citext = $1`;
            const date = new Date();

            app.db.one(treadReguest, slug)
                .then((data) => {
                    if (!posts.length) {
                        resolve(new Response({ status: 201, body: [] }));
                    }
                    app.db.tx((t) => {
                        const queries = posts.map((item) => {
                            return t.one('select id, nickname from users where lower(nickname) = lower($1)', [item.author]);
                        });

                        return t.batch(queries);
                    })
                        .then((users) => {
                            const values = posts.map((item, index) => {
                                const parent = item.parent ? item.parent : 0;
                                return {
                                    userid: users[index].id,
                                    parentid: parent,
                                    threadid: data.id,
                                    message: item.message,
                                    created: date,
                                    author: users[index].nickname,
                                    threadslug: data.slug,
                                    forumslug: data.forumslug,
                                }
                            });

                            const cs = new pgp.helpers.ColumnSet(
                                ['userid', 'parentid', 'threadid', 'message', 'created', 'author', 'threadslug', 'forumslug']
                                , { table: 'post'});

                            const query = pgp.helpers.insert(values, cs) +
                                ' RETURNING id, message, threadid, parentid, author, created, forumslug';

                            app.db.many(query)
                                .then((data) => {
                                    const result = data.map((item) => {
                                        const temp = {
                                            author: item.author,
                                            created: item.created,
                                            forum: item.forumslug,
                                            id: item.id,
                                            message: item.message,
                                            thread: item.threadid,
                                            parent: item.parentid,
                                        };

                                        if (item.isedited) {
                                            Object.assign(temp, { isEdited: item.isedited });
                                        }

                                        return temp;
                                    });
                                    resolve(new Response({ status: 201, body: result }));
                                })
                                .catch(() => {
                                    resolve(new Response({ status: 409, body: { message: 'Can\'t find user' } }));
                                })
                        })
                        .catch((error) => {
                            resolve(new Response({ status: 404, body: { message: 'not found' } }));
                        });

                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                });
        });
    }

    static getInfo(slug: any): Promise<Response> {
        const query = `select nickname, forumslug, votes, id, created, message, title, slug from thread where lower(thread.slug) = lower($1) or thread.id::citext = $1`;

        return new Promise((resolve) => {
            app.db.one(query, slug)
                .then((data) => {
                    const temp = {
                        author: data.nickname,
                        forum: data.forumslug,
                        votes: data.votes,
                        id: data.id,
                        created: data.created,
                        message: data.message,
                        title: data.title,
                        slug: data.slug,
                    };
                    resolve(new Response({ status: 200, body: temp }));
                })
                .catch((error) => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                });
        });
    }

    static updateThread(slug: any, title: string, message: string): Promise<Response> {
        const query = `update thread set (title, message) = (coalesce($1, title), coalesce($2, message)) 
            where lower(thread.slug) = lower($3) or thread.id::citext = 
            $3 returning nickname, created, forumslug, id, title, message, slug`;

        return new Promise((resolve) => {
            app.db.one(query, [title, message, slug])
                .then((data) => {
                    const temp = {
                        author: data.nickname,
                        created: data.created,
                        forum: data.forumslug,
                        id: data.id,
                        title: data.title,
                        message: data.message,
                        slug: data.slug,
                    };
                    resolve(new Response({ status: 200, body: temp }));
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                });
        });
    }

    static vote(slug: any, nickname: string, voice: number): Promise<Response> {
        return new Promise((resolve) => {
            app.db.one(`select nickname, forumslug, id, created, message, 
                    title, slug from thread where lower(thread.slug) = lower($1) or thread.id::citext = $1`, slug)
                .then((thread) => {
                    app.db.none('insert into vote (nickname, threadid, voice) values($1, $2, $3) ' +
                        'on conflict (nickname, threadid) do update set voice = $3', [nickname, thread.id, voice])
                        .then(() => {
                            app.db.one('select votes from thread where id = $1', thread.id)
                                .then((data) => {
                                    const temp = {
                                        author: thread.nickname,
                                        forum: thread.forumslug,
                                        votes: data.votes,
                                        id: thread.id,
                                        created: thread.created,
                                        message: thread.message,
                                        title: thread.title,
                                        slug: thread.slug,
                                    };

                                    resolve(new Response({ status: 200, body: temp }));
                                });
                        })
                        .catch((error) => {
                            resolve(new Response({ status: 404, body: { message: 'not found' } }));
                        });
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                });
        });
    }

    static getPosts(slug: any, params: string[]): Promise<Response> {
        let [ limit, since, sort, desc ] = params;
        let query = 'select post.id, post.created, post.threadid, post.forumslug, ' +
            'post.author, post.message, post.parentid, post.path from post ';
        const sign = desc === 'true' ? '<' : '>';

        limit = limit ? limit : null;
        desc = desc === 'true' && !!desc ? 'desc' : 'asc';

        switch (sort) {
            case 'tree':
                if (since) {
                    query += `where post.path ${sign} (select post.path from post where post.id = $3) 
                        and post.threadid = $1 order by post.path ${desc}, post.created, post.id limit $2`;
                } else {
                    query += `where post.threadid = $1 order by post.path ${desc}, post.created, post.id limit $2;`
                }
                break;
            case 'parent_tree':
                if (since) {
                    if (desc === 'asc') {
                        query += `join (select post.path[1] as root from post where post.threadid = $1 and post.path[1] >
                    (select post.path[1] from post where post.id = $3) and array_length(post.path, 1) = 1 order by root limit $2) 
                    root_posts on post.path[1] = root_posts.root order by post.path, post.created, post.id`;
                    } else {
                        query += `join (select post.path[1] as root from post where post.threadid = $1 and post.path[1] <
                    (select post.path[1] from post where post.id = $3) and array_length(post.path, 1) = 1 order by root desc limit $2) 
                    root_posts on post.path[1] = root_posts.root order by post.path[1] desc, post.path[2:], post.created, post.id`;
                    }
                } else {
                    query += `where post.path[1] in 
                    (select distinct post.path[1] from post where post.threadid = $1 and 
                    array_length(post.path, 1) = 1 order by post.path[1] ${desc} limit $2) 
                    order by post.path[1] ${desc}, post.path, post.created, post.id`;
                }
                break;
            default:
                if (since) {
                    query += `where post.threadid = $1 and post.id ${sign} $3 order by post.created ${desc}, post.id ${desc} limit $2`;
                } else {
                    query += `where post.threadid = $1 order by post.created ${desc}, post.id ${desc} limit $2`;
                }
                break;
        }

        return new Promise((resolve) => {
            app.db.one(`select id from thread where thread.slug = $1 or thread.id::citext = $1`, slug)
                .then((id) => {
                    app.db.manyOrNone(query, [id.id, limit, since])
                        .then((data) => {
                            const result = data.map((item) => {
                               return {
                                   author: item.author,
                                   forum: item.forumslug,
                                   id: item.id,
                                   created: item.created,
                                   thread: item.threadid,
                                   message: item.message,
                                   parent: item.parentid,
                               }
                            });
                            resolve(new Response({ status: 200, body: result }));
                        })
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                })
        });
    }
}
