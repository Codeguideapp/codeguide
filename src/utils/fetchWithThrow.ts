export function fetchWithThrow(
  input: RequestInfo,
  init?: RequestInit & { jsonRes?: boolean }
): Promise<any> {
  return fetch(input, init)
    .then(function (response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    })
    .then((res) => {
      if (init?.jsonRes !== false) {
        return res.json();
      } else {
        return res;
      }
    });
}
