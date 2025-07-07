import QuickCrypto from 'react-native-quick-crypto';

export class TencentTmt {
  private TRANSLATION_URL = 'https://tmt.tencentcloudapi.com';
  private SECRET_ID: string;
  private SECRET_KEY: string;
  private TOKEN: string;
  private host = 'tmt.tencentcloudapi.com';
  private service = 'tmt';
  private region = 'ap-beijing';
  private action = 'TextTranslate';
  private version = '2018-03-21';

  constructor(secretId?: string, secretKey?: string, token: string = '') {
    this.SECRET_ID = secretId || process.env.EXPO_PUBLIC_TENCENTCLOUD_SECRET_ID || '';
    this.SECRET_KEY = secretKey || process.env.EXPO_PUBLIC_TENCENTCLOUD_SECRET_KEY || '';
    this.TOKEN = token;

    if (!this.SECRET_ID || !this.SECRET_KEY) {
      throw new Error('SECRET_ID and SECRET_KEY are required');
    }
  }

  private sha256(message: any, secret: any, encoding?: any) {
    const hmac = QuickCrypto.createHmac('sha256', secret);
    if (encoding) {
      return hmac.update(message).digest(encoding);
    }
    return hmac.update(message).digest();
  }

  private getHash(message: string) {
    const hash = QuickCrypto.createHash('sha256');
    return hash.update(message).digest('hex');
  }

  private getDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const year = date.getUTCFullYear();
    const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + date.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  private createSignature(
    payload: string,
    timestamp: number
  ): {
    authorization: string;
    headers: Record<string, string>;
  } {
    const date = this.getDate(timestamp);

    // 步骤 1：拼接规范请求串
    const signedHeaders = 'content-type;host';
    const hashedRequestPayload = this.getHash(payload);
    const httpRequestMethod = 'POST';
    const canonicalUri = '/';
    const canonicalQueryString = '';
    const canonicalHeaders =
      'content-type:application/json; charset=utf-8\n' + 'host:' + this.host + '\n';

    const canonicalRequest =
      httpRequestMethod +
      '\n' +
      canonicalUri +
      '\n' +
      canonicalQueryString +
      '\n' +
      canonicalHeaders +
      '\n' +
      signedHeaders +
      '\n' +
      hashedRequestPayload;

    // 步骤 2：拼接待签名字符串
    const algorithm = 'TC3-HMAC-SHA256';
    const hashedCanonicalRequest = this.getHash(canonicalRequest);
    const credentialScope = date + '/' + this.service + '/' + 'tc3_request';
    const stringToSign =
      algorithm + '\n' + timestamp + '\n' + credentialScope + '\n' + hashedCanonicalRequest;

    // 步骤 3：计算签名
    const kDate = this.sha256(date, 'TC3' + this.SECRET_KEY);
    const kService = this.sha256(this.service, kDate);
    const kSigning = this.sha256('tc3_request', kService);
    const signature = this.sha256(stringToSign, kSigning, 'hex');

    // 步骤 4：拼接 Authorization
    const authorization =
      algorithm +
      ' ' +
      'Credential=' +
      this.SECRET_ID +
      '/' +
      credentialScope +
      ', ' +
      'SignedHeaders=' +
      signedHeaders +
      ', ' +
      'Signature=' +
      signature;

    // 构造请求头
    const headers: Record<string, string> = {
      Authorization: authorization,
      'Content-Type': 'application/json; charset=utf-8',
      Host: this.host,
      'X-TC-Action': this.action,
      'X-TC-Timestamp': timestamp.toString(),
      'X-TC-Version': this.version,
    };

    if (this.region) {
      headers['X-TC-Region'] = this.region;
    }

    if (this.TOKEN) {
      headers['X-TC-Token'] = this.TOKEN;
    }

    return { authorization, headers };
  }

  async getTranslationFromAPI(
    text: string,
    source: string = 'en',
    target: string = 'zh',
    projectId: number = 0
  ): Promise<any> {
    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const payload = JSON.stringify({
        SourceText: text,
        Source: source,
        Target: target,
        ProjectId: projectId,
      });

      const { headers } = this.createSignature(payload, timestamp);

      const response = await fetch(this.TRANSLATION_URL, {
        method: 'POST',
        headers,
        body: payload,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Translation API error:', error);
      throw error;
    }
  }
}

export type TmtTranslationContext = {
  SourceText: string;
  Source: string;
  Target: string;
  ProjectId: number;
};

export const client = new TencentTmt();
