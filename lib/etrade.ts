import crypto from "crypto";
import OAuth from "oauth-1.0a";

// E*TRADE OAuth 1.0a Service
// Production base: https://api.etrade.com
// Sandbox base: https://apisb.etrade.com

export interface OAuthTokens {
  token: string;
  tokenSecret: string;
}

export interface ETradePosition {
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
  marketValue: number;
  dayChange: number;
  dayChangePct: number;
  totalGain: number;
  totalGainPct: number;
  positionType: string;
}

export interface ETradeBalance {
  accountId: string;
  accountType: string;
  totalAccountValue: number;
  cashBalance: number;
  buyingPower: number;
  dayTradeBalance: number;
  netCash: number;
}

export interface ETradeAccount {
  accountId: string;
  accountIdKey: string;
  accountType: string;
  accountDesc: string;
}

export class ETradeService {
  private consumerKey: string;
  private consumerSecret: string;
  private baseUrl: string;
  private oauth: OAuth;

  constructor(consumerKey: string, consumerSecret: string, sandbox = false) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.baseUrl = sandbox
      ? "https://apisb.etrade.com"
      : "https://api.etrade.com";

    this.oauth = new OAuth({
      consumer: { key: consumerKey, secret: consumerSecret },
      signature_method: "HMAC-SHA1",
      hash_function(baseString, key) {
        return crypto
          .createHmac("sha1", key)
          .update(baseString)
          .digest("base64");
      },
    });
  }

  // Step 1: Get request token
  async getRequestToken(callbackUrl: string): Promise<OAuthTokens> {
    const url = `${this.baseUrl}/oauth/request_token`;

    const requestData = {
      url,
      method: "POST",
      data: { oauth_callback: callbackUrl },
    };

    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData)
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`E*TRADE request token failed: ${res.status} ${body}`);
    }

    const body = await res.text();
    const parsed = new URLSearchParams(body);
    return {
      token: parsed.get("oauth_token") || "",
      tokenSecret: parsed.get("oauth_token_secret") || "",
    };
  }

  // Get the URL for the user to authorize the app
  getAuthorizeUrl(requestToken: string): string {
    return `https://us.etrade.com/e/t/etws/authorize?key=${encodeURIComponent(this.consumerKey)}&token=${encodeURIComponent(requestToken)}`;
  }

  // Step 2: Exchange verifier for access token
  async getAccessToken(
    requestToken: string,
    requestTokenSecret: string,
    verifier: string
  ): Promise<OAuthTokens> {
    const url = `${this.baseUrl}/oauth/access_token`;

    const requestData = {
      url,
      method: "POST",
      data: { oauth_verifier: verifier },
    };

    const token = { key: requestToken, secret: requestTokenSecret };
    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    const res = await fetch(url, {
      method: "POST",
      headers: {
        ...authHeader,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`E*TRADE access token failed: ${res.status} ${body}`);
    }

    const body = await res.text();
    const parsed = new URLSearchParams(body);
    return {
      token: parsed.get("oauth_token") || "",
      tokenSecret: parsed.get("oauth_token_secret") || "",
    };
  }

  // Renew access token (must be called before midnight ET)
  async renewAccessToken(
    accessToken: string,
    accessTokenSecret: string
  ): Promise<void> {
    const url = `${this.baseUrl}/oauth/renew_access_token`;

    const requestData = { url, method: "GET" };
    const token = { key: accessToken, secret: accessTokenSecret };
    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...authHeader,
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`E*TRADE renew token failed: ${res.status} ${body}`);
    }
  }

  // Make an authenticated API call
  async apiCall<T>(
    method: string,
    path: string,
    accessToken: string,
    accessTokenSecret: string,
    queryParams?: Record<string, string>
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const fullUrl = queryParams
      ? `${url}?${new URLSearchParams(queryParams).toString()}`
      : url;

    const requestData = {
      url: fullUrl,
      method,
    };

    const token = { key: accessToken, secret: accessTokenSecret };
    const authHeader = this.oauth.toHeader(
      this.oauth.authorize(requestData, token)
    );

    const res = await fetch(fullUrl, {
      method,
      headers: {
        ...authHeader,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`E*TRADE API error ${res.status}: ${body}`);
    }

    return res.json() as Promise<T>;
  }

  // Get list of accounts
  async getAccounts(
    accessToken: string,
    accessTokenSecret: string
  ): Promise<ETradeAccount[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await this.apiCall<any>(
      "GET",
      "/v1/accounts/list",
      accessToken,
      accessTokenSecret
    );
    const accounts =
      data?.AccountListResponse?.Accounts?.Account || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return accounts.map((a: any) => ({
      accountId: a.accountId || "",
      accountIdKey: a.accountIdKey || "",
      accountType: a.accountType || "",
      accountDesc: a.accountDesc || a.accountName || "",
    }));
  }

  // Get positions for an account
  async getPositions(
    accountIdKey: string,
    accessToken: string,
    accessTokenSecret: string
  ): Promise<ETradePosition[]> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.apiCall<any>(
        "GET",
        `/v1/accounts/${accountIdKey}/portfolio`,
        accessToken,
        accessTokenSecret
      );

      const positions =
        data?.PortfolioResponse?.AccountPortfolio?.[0]?.Position || [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return positions.map((p: any) => {
        const quick = p.Quick || {};
        const totalCost = p.totalCost || 0;
        const quantity = p.quantity || 0;
        const marketValue =
          p.marketValue || (quick.lastTrade || 0) * quantity || 0;

        return {
          symbol: p.symbolDescription || p.Product?.symbol || "",
          quantity,
          costBasis: quantity !== 0 ? totalCost / quantity : 0,
          currentPrice: quick.lastTrade || 0,
          marketValue,
          dayChange: quick.change || 0,
          dayChangePct: quick.changePct || 0,
          totalGain: marketValue - totalCost,
          totalGainPct:
            totalCost !== 0
              ? ((marketValue - totalCost) / totalCost) * 100
              : 0,
          positionType: p.positionType || "LONG",
        };
      });
    } catch {
      return [];
    }
  }

  // Get account balance
  async getBalance(
    accountIdKey: string,
    accessToken: string,
    accessTokenSecret: string,
    accountType: string = "INDIVIDUAL"
  ): Promise<ETradeBalance | null> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await this.apiCall<any>(
        "GET",
        `/v1/accounts/${accountIdKey}/balance`,
        accessToken,
        accessTokenSecret,
        { instType: "BROKERAGE", realTimeNAV: "true" }
      );

      const bal = data?.BalanceResponse || {};
      const computed = bal.Computed || {};

      return {
        accountId: accountIdKey,
        accountType: bal.accountType || accountType,
        totalAccountValue:
          computed.RealTimeValues?.totalAccountValue ||
          computed.accountBalance ||
          0,
        cashBalance: computed.cashBalance || 0,
        buyingPower: computed.cashBuyingPower || 0,
        dayTradeBalance: computed.dtCashBuyingPower || 0,
        netCash: computed.netCash || 0,
      };
    } catch {
      return null;
    }
  }
}

// Singleton instance using environment variables
// Matches mirbot convention: ETRADE_PROD_KEY / ETRADE_PROD_SECRET
export const etrade = new ETradeService(
  process.env.ETRADE_PROD_KEY || "",
  process.env.ETRADE_PROD_SECRET || "",
  process.env.ETRADE_SANDBOX === "true"
);
