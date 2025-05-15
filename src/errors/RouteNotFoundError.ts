export default class RouteNotFoundError extends Error {
    path: string;
    constructor(message: string, path: string) {
        super(message);
        this.name = 'RouteNotFoundError';
        this.message = message;
        this.path = path;
    }
}