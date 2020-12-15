import { app } from "../../index";
import { RouterStore } from "../../store/routes";
import { ServiceRepository } from "../../repositories/service-repository/service-repository";
import { Response } from "../../models/response/response";

export class ServiceView {
    start() {
        app.server.post(RouterStore.api.post.service, (reg: any, res: any) => {
            ServiceRepository.delete().then((response: Response) => {
                res.status(response.attrs.status).send();
            });
        });

        app.server.get(RouterStore.api.get.service, (reg: any, res: any) => {
            ServiceRepository.info().then((response: Response) => {
               res.status(response.attrs.status).send(response.attrs.body);
            });
        });
    }
}
