import { Injectable } from '@nestjs/common';

@Injectable()
export class BaseGameService<T> {

  /**
   * Registered injections with "deferInjection"
   */
  protected injections: {
    [key: string]: any,
  } = {};

  /**
   * Registered injectables
   */
  protected injectables: T[] = [];

  /**
   * Defer an injection. A deferred injection will be stored and then injected
   * on the injectable creation.
   * @param injection
   */
  protected deferInjection(injection: any) {
    this.injections[injection.constructor.name] = injection;
  }

  /**
   * Create an injectable with his constructor and dependencies.
   * @param constructor
   */
  protected createInjectable(constructor: (new(...args) => T), props?: {[key: string]: any}): T {
    const args: any[] = this.getInjections(constructor);
    const injectable: T = new constructor(...args);
    if (props) {
      Object.keys(props).forEach((p: string) => {
        injectable[p] = props[p];
      });
    }
    this.injectables.push(injectable);
    return injectable;
  }

  /**
   * Get injections of a controller.
   * @param constructor
   */
  protected getInjections(constructor: (new(...args) => T)): any[] {
    const paramTypes: any[] = Reflect.getMetadata('design:paramtypes', constructor) || [];
    return paramTypes.map((p: any) => {
      if (!p) {
        return;
      }
      if (!this.injections[p.name]) {
        throw new Error(`Cannot get dependency ${p.name} for ${constructor.name}`);
      }
      return this.injections[p.name];
    });
  }

}
