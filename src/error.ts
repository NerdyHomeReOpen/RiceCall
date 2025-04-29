type StandardizedErrorOptions = Error & {
  name: string;
  part: string;
  tag: string;
  statusCode: number;
};

export default class StandardizedError extends Error {
  name: string;
  part: string;
  tag: string;
  statusCode: number;

  constructor(options: StandardizedErrorOptions) {
    super(options.message);
    this.name = options.name;
    this.part = options.part;
    this.tag = options.tag;
    this.statusCode = options.statusCode;
  }
}
