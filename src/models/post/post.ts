import { Model } from "../model/model";

export interface IPost {
    id?: number,
    parent?: string,
    author: string,
    message: string,
    isEdited?: boolean,
    forum?: string,
    thread?: number,
    created?: string,
}

export class ModelPost extends Model<IPost> {
    constructor(attrs: IPost = null) {
        super(attrs);

        const defaults: IPost = {
            id: null,
            parent: null,
            author: null,
            message: null,
            isEdited: null,
            forum: null,
            thread: null,
            created: null,
        };

        this.attrs = { ...defaults, ...attrs };
    }
}
