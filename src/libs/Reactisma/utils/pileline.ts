type MiddlewareCallback = (next: () => void) => void;

class Middleware {
  private middlewares: MiddlewareCallback[] = [];

  use(callback: MiddlewareCallback): void {
    this.middlewares.push(callback);
  }

  run(i: number = 0): void {
    if (i < this.middlewares.length) {
      this.middlewares[i].call(null, () => this.run(i + 1));
    }
  }

  clear(): void {
    this.middlewares = [];
  }
}

const pipeline = new Middleware();
export default pipeline;