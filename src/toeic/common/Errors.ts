import { Request } from './Transport';

/**
 * Transport#requestでErrorとなった場合に使用。
 */
export class RequestException extends Error {
  method: string;
  url: string;
  error: Error;

  constructor(req: Request, url: string, error: Error) {
    let requestData;
    switch (req.method) {
      case 'get': {
        requestData = req.params;
      }
      case 'post': {
        requestData = req.payload;
      }
    }
    super(`Unable to ${req.method} ${url}. data = ${requestData}`);
    this.method = req.method || 'get';
    this.url = url;
    this.error = error;
  }
}

/**
 * ToeicClientの初期化に不備があった場合に使用。
 */
export class ClientConfigException extends Error {
  name: string;

  constructor(missingConfig: string) {
    super(`設定値が不足しています: ${missingConfig}`);
    this.name = 'ClientConfigException';
  }
}
