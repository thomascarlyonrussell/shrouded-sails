export function handler() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8'
    },
    body: JSON.stringify({ status: 'ok' })
  };
}
