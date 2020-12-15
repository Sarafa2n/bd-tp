import { Model } from "../model/model";

export interface IThread {
    id?: number,
    title: string,
    author: string,
    forum?: string,
    message: string,
    votes?: string,
    slug?: string,
    created: object | string,
}

export class ModelThread extends Model<IThread> {
    constructor(attrs: IThread = null) {
        super(attrs);

        const defaults: IThread = {
            id: null,
            title: null,
            author: null,
            forum: null,
            message: null,
            votes: null,
            created: {},
        };

        this.attrs = { ...defaults, ...attrs };
    }
}
