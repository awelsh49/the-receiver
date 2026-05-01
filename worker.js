function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function normalizeResponse(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function containsHow(value) {
  return /\bhow\b/i.test(value);
}

async function handleSignalResponse(request) {
  if (request.method !== "POST") {
    return jsonResponse(
      {
        accepted: false,
        title: "Method not allowed",
        message: "The receiver cannot process that request."
      },
      405
    );
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      {
        accepted: false,
        title: "The signal did not react",
        message: "It must be expecting something else."
      },
      400
    );
  }

  const userResponse = normalizeResponse(body.response);

  if (!userResponse) {
    return jsonResponse({
      accepted: false,
      title: "The signal did not react",
      message: "It must be expecting something else."
    });
  }

  if (!containsHow(userResponse)) {
    return jsonResponse({
      accepted: false,
      title: "The signal did not react",
      message: "It must be expecting something else."
    });
  }

  return jsonResponse({
    accepted: true,
    title: "Communication received",
    message: "The signal in the lamp glows as if it received the communication back, then disappears entirely.",
    unlock: {
      episode: 2,
      label: "Signal 02 is now open",
      href: "./episode-2.html"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/signal-01/respond") {
      return handleSignalResponse(request);
    }

    return env.ASSETS.fetch(request);
  }
};
