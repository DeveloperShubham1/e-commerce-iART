
export function maskToken(token) {
  if (!token || token.length < 10) return "***";
  return token.slice(0, 6) + "..." + token.slice(-4);
}

export function maskInstagram(ig) {
  if (!ig) return ig;
  const obj = ig.toObject ? ig.toObject() : { ...ig };
  if (obj.accessToken) obj.accessToken = maskToken(obj.accessToken);
  if (obj.pageAccessToken) obj.pageAccessToken = maskToken(obj.pageAccessToken);
  if (obj.appSecret) obj.appSecret = maskToken(obj.appSecret);
  return obj;
}
