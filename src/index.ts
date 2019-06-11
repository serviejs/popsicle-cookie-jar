import { CookieJar, Cookie } from "tough-cookie";
import { CommonRequest, CommonResponse } from "servie/dist/common";

/**
 * Export cookie jar support.
 */
export { CookieJar };

/**
 * Read and write cookies with a cookie jar.
 */
export function cookies<T extends CommonRequest, U extends CommonResponse>(
  jar = new CookieJar()
): (req: T, next: () => Promise<U>) => Promise<U> {
  return async function cookieJar(req, next) {
    const prevCookies = req.headers.getAll("Cookie").join("; ");

    const res = await new Promise<U>((resolve, reject) => {
      jar.getCookieString(req.url, (err: Error | null, cookies: string) => {
        if (err) return reject(err);

        if (cookies) {
          req.headers.set(
            "Cookie",
            prevCookies ? `${prevCookies}; ${cookies}` : cookies
          );
        }

        return resolve(next());
      });
    });

    const cookies = res.headers.getAll("set-cookie");

    await Promise.all(
      cookies.map(function(cookie) {
        return new Promise<void>(function(resolve, reject) {
          jar.setCookie(
            cookie,
            req.url,
            { ignoreError: true },
            (err: Error | null) => (err ? reject(err) : resolve())
          );
        });
      })
    );

    return res;
  };
}
