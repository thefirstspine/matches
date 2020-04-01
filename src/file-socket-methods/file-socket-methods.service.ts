import { Injectable } from '@nestjs/common';
import { GameService } from 'src/game/game.service';

@Injectable()
export class FileSocketMethodsService {

  protected static instance: FileSocketMethodsService;

  constructor(protected readonly gameService: GameService) {
    FileSocketMethodsService.instance = this;
  }

  static get fileSocketMethods() {
    return {
      'close-game': (id: number) => {
        FileSocketMethodsService.instance.gameService.closeGame(id);
      },
    };
  }

}
