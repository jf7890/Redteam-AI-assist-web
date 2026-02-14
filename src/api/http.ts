export type HttpErrorShape = {
  message?: string;
  detail?: string;
  error?: string;
};

export class HttpError extends Error {
  status: number;
  url: string;
  body: any;

  constructor(opts: { status: number; url: string; message: string; body: any }) {
    super(opts.message);
    this.name = "HttpError";
    this.status = opts.status;
    this.url = opts.url;
    this.body = opts.body;
  }
}

export async function httpJson<T>(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 15000, ...init } = opts;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers || {})
      }
    });

    const text = await res.text();
    const body = text ? safeJsonParse(text) : null;

    if (!res.ok) {
      const msg =
        (body as HttpErrorShape | null)?.detail ||
        (body as HttpErrorShape | null)?.message ||
        (body as HttpErrorShape | null)?.error ||
        `${res.status} ${res.statusText}`;

      throw new HttpError({ status: res.status, url, message: msg, body });
    }

    return body as T;
  } catch (e: any) {
    // AbortError -> nicer message
    if (e?.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

function safeJsonParse(s: string): any {
  try {
    return JSON.parse(s);
  } catch {
    // If server returns plain text, wrap it.
    return { message: s };
  }
}
