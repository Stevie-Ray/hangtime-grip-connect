function json(body: object, status: number): Response {
  return Response.json(body, { status })
}

async function fetchCoefficient(request: Request): Promise<Response> {
  if (request.method !== "GET") {
    return new Response(null, {
      headers: { allow: "GET" },
      status: 405,
    })
  }

  const accessKey = process.env.FREZ_ACCESS_KEY?.trim()
  if (!accessKey) {
    return json({ error: "Missing FREZ_ACCESS_KEY." }, 503)
  }

  const url = new URL(request.url)
  const name = url.searchParams.get("name")?.trim()
  if (!name?.startsWith("FrezDyno-") || url.searchParams.size !== 1) {
    return json({ error: "Provide exactly one valid Frez Dyno name." }, 400)
  }

  try {
    const upstream = await fetch(`https://api.frez.app/v1/dyno/coefficient?name=${encodeURIComponent(name)}`, {
      headers: {
        "X-Frez-Access-Key": accessKey,
      },
    })

    return new Response(await upstream.text(), {
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
      status: upstream.status,
    })
  } catch {
    return json({ error: "Frez Dyno coefficient service is unavailable." }, 502)
  }
}

export default {
  fetch: fetchCoefficient,
}
