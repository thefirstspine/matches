import { GameWorkerService } from './game-worker/game-worker.service';
import { GameHookService } from './game-hook/game-hook.service';

export interface IHasGameWorkerService {
  gameWorkerService: GameWorkerService;
}

export interface IHasGameHookService {
  gameHookService: GameHookService;
}
