import Transport, { Request } from '../common/Transport';
import { Score } from './models';

export default class ScoreClient {
  urlBase: string = '/Usr/Pages/Member/ResultGraph.aspx';
  transport: Transport;

  constructor(transport: Transport) {
    this.transport = transport;
  }

  get(): Score {
    const req: Request = { url: this.urlBase };
    const res = this.transport.get(req);

    let score = {
      listening: null,
      reading: null
    };
    return score;
  }
}
