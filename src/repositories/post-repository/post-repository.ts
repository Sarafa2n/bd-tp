import { Response } from "../../models/response/response";
import {app} from "../../index";
import {IPost, ModelPost} from "../../models/post/post";
import {ModelUser} from "../../models/user/user";
import {ModelForum} from "../../models/forum/forum";

export class PostRepository {
    static updatePost(id: number, message: string): Promise<Response> {
        return new Promise((resolve) => {
            app.db.one('update post set (message, isedited) = (coalesce($1, message), coalesce(message <> $1, isedited)) where id = $2 ' +
                'returning id, parentid, author, message, forumslug, threadid, created, isedited', [message, id])
                .then((data) => {
                    let attrs: IPost = {
                        id: data.id,
                        parent: data.parentid,
                        author: data.author,
                        message: data.message,
                        forum: data.forumslug,
                        thread: data.threadid,
                        created: data.created,
                        isEdited: data.isedited
                    };
                    resolve(new Response({ status: 200, body: attrs }));
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                });
        });
    }

    static getPostDetails(id: number, query: any): Promise<Response> {
        const promiseArray: Promise<void>[] = [];
        const result = {};

        return new Promise((resolve) => {
            app.db.one('select id, parentid, author, message, forumslug, threadid, created, isedited, userid from post where id = $1', [id])
                .then((data) => {
                    let attrs: IPost = {
                        id: data.id,
                        parent: data.parentid,
                        author: data.author,
                        message: data.message,
                        forum: data.forumslug,
                        thread: data.threadid,
                        created: data.created,
                        isEdited: data.isedited,

                    };

                    Object.assign(result, { post: attrs });

                    if (query.related) {

                        if (query.related.includes('user')) {
                            const userPromise = app.db.one('select id, nickname, about, fullname, email from users where id = $1', [data.userid])
                                .then((data) => {
                                    const user = new ModelUser(data);
                                    Object.assign(result, {author: user.attrs});
                                });
                            promiseArray.push(userPromise);
                        }

                        if (query.related.includes('thread')) {
                            const threadPromise = app.db.one(
                                'select nickname, forumslug, votes, id, created, message, title, slug from thread where id = $1', [data.threadid])
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
                                    Object.assign(result, {thread: temp});
                                });
                            promiseArray.push(threadPromise);
                        }

                        if (query.related.includes('forum')) {
                            const forumPromise = app.db.one(
                                'select title, nickname, slug, posts, threads from forum where slug = $1', [data.forumslug])
                                .then((data) => {
                                    const forum = new ModelForum({
                                        title: data.title,
                                        user: data.nickname,
                                        slug: data.slug,
                                        posts: data.posts,
                                        threads: data.threads
                                    });

                                    Object.assign(result, {forum: forum.attrs});
                                });
                            promiseArray.push(forumPromise);
                        }
                    }

                    Promise.all(promiseArray).then(() => {
                        resolve(new Response({ status: 200, body: result }));
                    });
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'not found' } }));
                });
        });
    }
}
