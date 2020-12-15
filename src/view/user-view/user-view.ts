import { app } from '../../index';
import { RouterStore } from "../../store/routes";
import { ModelUser, IUser } from "../../models/user/user";
import { UserRepository } from "../../repositories/user-repository/user-repository";
import { Response } from "../../models/response/response";

export class UserView {
    start() {
        app.server.post(RouterStore.api.post.user.create, (reg: any, res: any) => {
            const data: IUser = {
                nickname: reg.params.nickname,
                email: reg.body.email,
                about: reg.body.about,
                fullname: reg.body.fullname,
            };

            const user = new ModelUser(data);

            UserRepository.create(user).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.post(RouterStore.api.get.user.profile, (reg: any, res: any) => {
            const data: IUser = {
                nickname: reg.params.nickname,
                email: reg.body.email,
                about: reg.body.about,
                fullname: reg.body.fullname,
            };

            const user = new ModelUser(data);
            UserRepository.update(user).then((response: Response) => {
                res.status(response.attrs.status).send(response.attrs.body);
            });
        });

        app.server.get(RouterStore.api.get.user.profile, (reg: any, res: any) => {
            UserRepository.profile(reg.params.nickname).then((response: Response) => {
               res.status(response.attrs.status).send(response.attrs.body);
            });
        });
    }
}
