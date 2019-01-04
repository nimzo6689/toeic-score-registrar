import Transport from './common/Transport';
import ScoreClient from './scores/ScoreClient';
import { ClientConfigException } from './common/Errors';

export class ToeicClient {
  transport: Transport;
  scores: ScoreClient;

  constructor(loginId: string, password: string) {
    if (!loginId || !password) {
      const err = new ClientConfigException('loginId, password');
      Logger.log(err.message);
      throw err;
    }

    this.transport = new Transport(loginId, password);
    this.scores = new ScoreClient(this.transport);
  }
}
