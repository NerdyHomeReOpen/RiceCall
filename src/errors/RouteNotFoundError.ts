import StandardizedError from "@/error";

export default class RouteNotFoundError extends StandardizedError {
    path: string;
    constructor(message: string, path: string) {
        super({
            name: 'ServerError',
            message: message,
            part: 'ROUTE',
            tag: 'ROUTE_NOT_FOUND_ERROR',
            statusCode: 404,
        });
        this.path = path;
    }
}
