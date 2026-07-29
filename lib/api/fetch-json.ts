export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const json = (await res.json()) as unknown;

  if (!res.ok) {
    const message = (json as { error?: string })?.error ?? "Something went wrong";
    throw new Error(message);
  }

  return json as T;
}

