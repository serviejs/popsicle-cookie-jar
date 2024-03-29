import { describe, expect, it } from "vitest";
import { Request, Response } from "servie/dist/node";
import { cookies, CookieJar } from "./index";

describe("popsicle cookie jar", () => {
  const req = new Request("http://example.com/");
  const ok = new Response(null, { status: 200 });

  const redirect = new Response(null, {
    status: 302,
    headers: {
      Location: "/test",
      "Set-Cookie":
        "hello=world; expires=Wed, 01 Jan 3000 00:00:00 GMT; path=/",
    },
  });

  it("should use cookie store for requests", async () => {
    const middleware = cookies();
    const res1 = await middleware(req.clone(), async () => redirect.clone());

    expect(res1.headers.get("set-cookie")).not.toBeNull();

    const req2 = req.clone();
    const res2 = await middleware(req2, async () => {
      expect(req2.headers.get("cookie")).toEqual("hello=world");

      return ok.clone();
    });

    expect(res2.headers.get("set-cookie")).toBeNull();

    expect.assertions(3);
  });

  it("should allow custom cookie jars", async () => {
    const jar = new CookieJar();
    const middleware = cookies(jar);

    jar.setCookieSync("test=true", req.url);

    const req1 = req.clone();
    const res2 = await middleware(req1, async () => {
      expect(req1.headers.get("cookie")).toEqual("test=true");

      return ok.clone();
    });

    expect(res2.headers.get("set-cookie")).toBeNull();
  });

  it("should merge cookies with existing cookies", async () => {
    const jar = new CookieJar();
    const middleware = cookies(jar);

    jar.setCookieSync("test=true", req.url);

    const req1 = req.clone();
    req1.headers.set("cookie", "manual=true");

    const res2 = await middleware(req1, async () => {
      expect(req1.headers.get("cookie")).toEqual("manual=true; test=true");

      return ok.clone();
    });

    expect(res2.headers.get("set-cookie")).toBeNull();
  });
});
