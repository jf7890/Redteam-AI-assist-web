export class HttpError extends Error {
  status: number;
  url: string;
  bodyText?: string;

  constructor(message: string, status: number, url: string, bodyText?: string) {
    super(message);
    this.status = status;
    this.url = url;
    this.bodyText = bodyText;
  }
}

async function parseJsonOrText(text: string): Promise<any> {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function readErrorMessage(res: Response, url: string): Promise<HttpError> {
  const text = await res.text().catch(() => "");
  const parsed = await parseJsonOrText(text);
  const msg =
    (parsed && typeof parsed === "object" && (parsed.detail || parsed.message)) ||
    `${res.status} ${res.statusText}`;
  return new HttpError(String(msg), res.status, url, text);
}

export async function httpJson<T>(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = 20000, ...init } = opts;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {};
    if (init.body) headers["Content-Type"] = "application/json";
    if (init.headers) Object.assign(headers, init.headers as any);

    const res = await fetch(url, { ...init, headers, signal: ac.signal });

    if (!res.ok) throw await readErrorMessage(res, url);

    // Handle 204 No Content
    if (res.status === 204) return null as unknown as T;

    const text = await res.text();
    const data = await parseJsonOrText(text);
    return data as T;
  } finally {
    clearTimeout(t);
  }
}

export async function httpVoid(
  url: string,
  opts: RequestInit & { timeoutMs?: number } = {}
): Promise<void> {
  const { timeoutMs = 20000, ...init } = opts;
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = {};
    if (init.body) headers["Content-Type"] = "application/json";
    if (init.headers) Object.assign(headers, init.headers as any);

    const res = await fetch(url, { ...init, headers, signal: ac.signal });
    if (!res.ok) throw await readErrorMessage(res, url);
    return;
  } finally {
    clearTimeout(t);
  }
}
