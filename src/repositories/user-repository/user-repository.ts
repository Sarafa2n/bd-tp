import { ModelUser } from "../../models/user/user";
import { Response } from "../../models/response/response";
import { app } from "../../index";

export class UserRepository {
    static create(user: ModelUser): Promise<Response> {
        const { nickname, email, fullname, about } = user.attrs;

        return new Promise((resolve) => {
            app.db.many('select nickname, fullname, about, email from users as usr where lower(usr.nickname) = lower($1) or lower(usr.email) = lower($2)', [nickname, email])
                .then((data) => {
                    resolve(new Response({ status: 409,  body: data }));
                })
                .catch((error) => {
                    app.db.one(
                        'insert into  users (nickname, email, fullname, about) values ($1, $2, $3, $4) ' +
                        'returning nickname, id, email, about, fullname',
                        [nickname, email, fullname, about])
                        .then((data) => {
                            resolve(new Response({ status: 201, body: user.attrs }));
                        })
                        .catch((error) => {
                            resolve(new Response({ status: 500, body: { message: error.detail }}));
                        });
                });
        });
    }

    static update(user: ModelUser): Promise<Response> {
        const { nickname, email, fullname, about } = user.attrs;

        return new Promise((resolve) => {
            app.db.one('select nickname, fullname, about, email  from users where nickname = $1', [nickname])
                .then((data) => {
                    app.db.one(
                        'update users set (email, about ,fullname) = (coalesce($1, email), coalesce($2, about), coalesce($3, fullname)) where nickname = $4' +
                        'returning id, email, nickname, about, fullname',
                        [email, about, fullname, nickname])
                        .then((data) => {
                            user.update(data);
                            resolve(new Response({ status: 200, body: user.attrs }));
                        })
                        .catch((error) => {
                            resolve(new Response({ status: 409, body: { message: error.detail } }));
                        });
                })
                .catch(() => {
                    resolve(new Response({ status: 404, body: { message: 'Can\'t find user' }}))
                })
        });
    }

    static profile(nickname: string): Promise<Response> {
        return new Promise((resolve) => {
           app.db.one('select nickname, fullname, about, email from users where nickname = $1', [nickname])
               .then((data) => {
                   const user = new ModelUser(data);
                   resolve(new Response({ status: 200, body: user.attrs }));
               })
               .catch(() => {
                   resolve(new Response({ status: 404, body: { message: 'Can\'t find user' }}))
               })
        });
    }
}
