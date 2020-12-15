import { Model } from "../model/model";

export interface IResponse {
    status: number,
    body?: any
    message? : string,
}

export class Response extends Model<IResponse> {
    constructor(attrs: IResponse = null) {
        super(attrs);

        const defaults: IResponse = {
            status: null,
            body: null,
            message: null,
        };

        this.attrs = { ...defaults, ...attrs };
    }
}

