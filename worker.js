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
    .toLowerCase()
    .replace(/[°º]/g, " ")
    .replace(/[−–—]/g, "-")
    .replace(/[,\n\r\t]+/g, " ")
    .replace(/\s+/g, " ");
}

function containsWord(value, word) {
  const pattern = new RegExp(`\\b${word}\\b`, "i");
  return pattern.test(value);
}

function failureResponse() {
  return jsonResponse({
    accepted: false,
    title: "The signal did not react",
    message: "It must be expecting something else."
  });
}

function successResponse(data) {
  return jsonResponse({
    accepted: true,
    ...data
  });
}

async function readResponseFromRequest(request) {
  try {
    const body = await request.json();
    return normalizeResponse(body.response);
  } catch {
    return "";
  }
}

/**
 * Signal 02 expected answer:
 * Latitude: 48.2 north
 * Longitude: -124 west
 *
 * Accepts examples like:
 * - 48.2 N, -124 W
 * - 48.2N -124W
 * - 48.2 north, -124 west
 * - 48.2 n -124 w
 * - 48.2N, 124W
 * - 48.2 north 124 west
 */
function isSignal02CoordinateAnswer(value) {
  const normalized = normalizeResponse(value);

  const hasLatitude =
    /(?:^|[^0-9])48\.2\s*(?:n|north)\b/.test(normalized);

  const hasLongitude =
    /(?:^|[^0-9])-?\s*124\s*(?:w|west)\b/.test(normalized);

  return hasLatitude && hasLongitude;
}

async function handleSignal01Response(request) {
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

  const userResponse = await readResponseFromRequest(request);

  if (!userResponse || !containsWord(userResponse, "how")) {
    return failureResponse();
  }

  return successResponse({
    title: "Communication received",
    message:
      "The signal in the lamp glows as if it received the communication back, then disappears entirely.",
    unlock: {
      episode: 2,
      label: "Signal 02 is now open",
      href: "./episode-2.html"
    }
  });
}

async function handleSignal02Response(request) {
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

  const userResponse = await readResponseFromRequest(request);

  if (!userResponse || !isSignal02CoordinateAnswer(userResponse)) {
    return failureResponse();
  }

  return successResponse({
    title: "Coordinates received",
    message:
      "The two spheres draw together. A thin line stabilizes between them. Then the formation vanishes.",
    unlock: {
      episode: 3,
      label: "Signal 03 is now open",
      href: "./episode-3.html"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/signal-01/respond") {
      return handleSignal01Response(request);
    }

    if (url.pathname === "/api/signal-02/respond") {
      return handleSignal02Response(request);
    }

    const response = await env.ASSETS.fetch(request);

    if (url.pathname.endsWith(".usdz")) {
      const headers = new Headers(response.headers);
      headers.set("Content-Type", "model/vnd.usdz+zip");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    }

    return response;
  }
};
