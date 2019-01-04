export enum HTTP_METHODS {
  GET = 'get',
  POST = 'post'
}

export default class Constants {
  // URLs
  static readonly BASE_URL = 'https://ms.toeic.or.jp';

  // インスタンス化防止のため
  private constructor() {}
}
