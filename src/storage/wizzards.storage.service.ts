import { StorageService } from './storage.service';
import { Injectable } from '@nestjs/common';
import { IWizard } from '@thefirstspine/types-arena';

/**
 * The storage service for the "IWizard" objects.
 */
@Injectable()
export class WizzardsStorageService extends StorageService<IWizard> {

  constructor() {
    super('wizzards');
  }

}
