type StandardizedErrorOptions = Error & {
  name: string;
  part: string;
  tag: string;
  statusCode: number;
};

export default class StandardizedError {
  message: string;
  name: string;
  part: string;
  tag: string;
  statusCode: number;

  constructor(options: StandardizedErrorOptions) {
    this.message = options.message;
    this.name = options.name;
    this.part = options.part;
    this.tag = options.tag;
    this.statusCode = options.statusCode;
  }
}
