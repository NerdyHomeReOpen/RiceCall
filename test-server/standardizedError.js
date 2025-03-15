module.exports = class StandardizedError extends Error {
  constructor(
    error_message = 'An error occurred',
    name = 'Error',
    part = 'UNKNOWN_PART',
    tag = 'UNKNOWN_ERROR',
    status_code = 500,
    title = 'Error',
    handler = () => {},
  ) {
    super(title);
    this.name = name;
    this.error_message = error_message;
    this.part = part;
    this.tag = tag;
    this.status_code = status_code;
    this.handler = handler;
  }
};
