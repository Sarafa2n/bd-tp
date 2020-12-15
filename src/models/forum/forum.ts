import { Model } from "../model/model";

export interface IForum {
    title: string,
    user: string,
    slug: string,
    posts?: number,
    threads?: number
}

export class ModelForum extends Model<IForum> {
    constructor(attrs: IForum = null) {
        super(attrs);

        const defaults: IForum = {
            title: null,
            user: null,
            slug: null,
            posts: null,
            threads: null
        };

        this.attrs = { ...defaults, ...attrs };
    }
}
