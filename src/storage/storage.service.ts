import * as fs from 'fs';
import * as path from 'path';

/**
 * The abstract storage service. Every data that has to be stored on the disc have to use this
 * service to abstract savings.
 */
export abstract class StorageService<T extends ISaveable> {

  /**
   * The directory where the service will save the data
   */
  protected directory: string;

  /**
   * Main service constructor
   * @param directory
   */
  constructor(directory: string) {
    this.directory = directory;
    if (!fs.existsSync(this.getDirData())) {
      fs.mkdirSync(this.getDirData());
    }
    if (!fs.existsSync(this.getDirDataSave())) {
      fs.mkdirSync(this.getDirDataSave());
    }
  }

  /**
   * Save a ISaveable object.
   * @param data
   */
  public save(data: T) {
    fs.writeFileSync(path.join(this.getDirDataSave(), data.id.toString()), JSON.stringify(data));
  }

  /**
   * Get an object from its ID.
   * @param id
   */
  public get(id: number): T|null {
    if (!fs.existsSync(path.join(this.getDirDataSave(), id.toString()))) {
      return null;
    }
    return JSON.parse(
      fs.readFileSync(
        path.join(this.getDirDataSave(), id.toString()),
      ).toString(),
    );
  }

  /**
   * Get the IDs of the entities found on the disk
   */
  public getIds(): number[] {
    const files: string[] = fs.readdirSync(this.getDirDataSave());
    return files.sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? -1 : 1).map((f: string) => parseInt(f, 10));
  }

  /**
   * Get the next ID of the ISaveable object.
   */
  public getNextId(): number {
    const files: string[] = fs.readdirSync(this.getDirDataSave());
    if (files.length === 0) {
      return 1;
    }
    const filesReversed: string[] = files.sort((a, b) => parseInt(a, 10) > parseInt(b, 10) ? -1 : 1);
    return parseInt(filesReversed[0], 10) + 1;
  }

  /**
   * Get the data directory
   */
  protected getDirData(): string {
    return ('/data');
  }

  /**
   * Get the object data directory
   */
  protected getDirDataSave(): string {
    return (`/data/${this.directory}`);
  }

}

/**
 * The object to be saved in the storage system.
 */
export interface ISaveable {
  id: number;
}
