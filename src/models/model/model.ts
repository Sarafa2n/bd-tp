
export abstract class Model<TModel> {
    public attrs: TModel;

    protected constructor(attrs: TModel = null) {
        this.attrs = attrs;
    }

    update(attrs: TModel): void {
        this.attrs = Object.assign(this.attrs, attrs);
    }
}
