// tslint:disable: no-console
export class GracefulStop {

  static async call() {
    console.log('Send stop message to service');
    await new Promise(((r) => setTimeout(r, 500)));
    console.log('Disable all new games.');
    await new Promise(((r) => setTimeout(r, 1000)));
    console.log('Waiting for all games ended.');
    await new Promise(((r) => setTimeout(r, 2000)));
    // Stop
    process.exit();
  }

}

GracefulStop.call();
