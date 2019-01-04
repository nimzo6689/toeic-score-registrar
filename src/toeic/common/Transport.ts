import Constants, { HTTP_METHODS } from './Constants';
import { RequestException } from './Errors';

/**
 * ログインするための認証情報
 */
export interface AuthOption {
  accountId: string;
  password: string;
}

// -- GoogleAppsScript.URL_Fetch.URLFetchRequestOptions --
type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;
type method = 'get' | 'delete' | 'patch' | 'post' | 'put';
type payload = string | object | GoogleAppsScript.Base.Blob;
// -- GoogleAppsScript.URL_Fetch.HTTPResponse --
type HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;

/**
 * 各Clientからのリクエスト用のModel
 */
export interface Request {
  url?: string;
  method?: method;
  params?: string;
  payload?: payload;
}

interface Headers {
  Cookie?: string;
}

/**
 * UrlFetchAppのラッパークラス
 */
export default class Transport {
  private cookie?: string;

  /**
   * @param loginId - ログインID
   * @param password - パスワード
   */
  constructor(private loginId: string, private password: string) {}

  /**
   * GETリクエスト送信
   *
   * @param req - リクエスト情報（リクエストパラメーター）
   */
  get(req: Request): HTTPResponse {
    req.method = HTTP_METHODS.GET;
    try {
      return this.request(req);
    } catch (ex) {
      const err = new RequestException(req, req.url, ex);
      Logger.log(err.message);
      throw err;
    }
  }

  /**
   * HTTPリクエスト送信
   *
   * @param req - リクエスト情報（HTTPメソッド、リクエストパラメーター、BODY）
   */
  private request(req: Request): HTTPResponse {
    // コール先のサーバー負荷を下げるため、どのリクエストに対しても1秒停止する。
    Utilities.sleep(1_000);
    let res: HTTPResponse = UrlFetchApp.fetch(
      `${Constants.BASE_URL}${req.url}`,
      this.formatRequest(req)
    );
    return this.retryRequestIfNeeded(req, res);
  }

  /**
   * Request型からURLFetchRequestOptions型へ変換
   *
   * @param req - リクエスト情報（HTTPメソッド、リクエストパラメーター、BODY）
   */
  private formatRequest(req: Request): URLFetchRequestOptions {
    const options: URLFetchRequestOptions = {
      method: req.method,
      headers: this.addCookieInHeaders(),
      //TODO: payloadの実装
      contentType: 'application/x-www-form-urlencoded',
      followRedirects: false,
      muteHttpExceptions: true
    };

    if (['post'].some(v => v === req.method)) {
      options.payload = req.payload;
    }
    return options;
  }

  /**
   * Cookieが設定済みの場合、Headers内にCookieを指定したオブジェクトを返す。
   */
  private addCookieInHeaders(): Headers {
    if (this.cookie) {
      return {
        Cookie: this.cookie
      };
    }
    return {};
  }

  /**
   * 必要があればリトライ処理を行う
   *
   * @param req - 一度UrlFetchApp#fetchで使用したリクエスト情報
   * @param res - 一度UrlFetchApp#fetchで取得したレスポンス情報
   */
  private retryRequestIfNeeded(req: Request, res: HTTPResponse) {
    // セッションがまだ有効かどうか
    if (!this.isOutdated(res)) {
      // 認証情報が失効された場合、再度ログイン処理を行った後、リトライ処理をする。
      this.renewSession();
      return this.request(req);
    }

    // レスポンスコードが400以上であればリトライしない。
    if (res.getResponseCode() >= 400) {
      throw new Error(res.getResponseCode().toString());
    }
    return res;
  }

  /**
   * 送信したリクエストが認証情報の失効となっていないか検証
   *
   * @param res - UrlFetchApp#fetchのHTTP Response
   */
  private isOutdated(res: HTTPResponse): boolean {
    return res.getResponseCode() !== 401;
  }

  /**
   * ログイン実施
   */
  private renewSession() {
    const req: Request = {
      method: 'post',
      payload: `IDToken1=${this.loginId}&IDToken2=${this.password}&encoded=true`
    };

    let res = this.request(req);
    let headers: any = res.getAllHeaders();
    let userInfoRegExp = /UserInfo=(.*?);/i.exec(headers['Set-Cookie']);
    let userInfo = (userInfoRegExp && userInfoRegExp[1]) || {};
    // Cookieを設定
    this.cookie = `UserInfo=${userInfo}; path=/; secure`;
  }
}
