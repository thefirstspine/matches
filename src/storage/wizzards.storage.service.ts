import { StorageService } from './storage.service';
import { Injectable } from '@nestjs/common';
import { IWizzard } from '../@shared/arena-shared/wizzard';

/**
 * The storage service for the "IWizzard" objects.
 */
@Injectable()
export class WizzardsStorageService extends StorageService<IWizzard> {

  constructor() {
    super('wizzards');
  }

}
