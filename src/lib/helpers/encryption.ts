export async function importKey(secret: string) {
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signResponse(message: string, secret: string) {
  const key = await importKey(secret);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function verifySignature(
  message: string,
  signature: string,
  secret: string
) {
  const key = await importKey(secret);

  const sigBuf = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));

  return await crypto.subtle.verify(
    "HMAC",
    key,
    sigBuf,
    new TextEncoder().encode(message)
  );
}
