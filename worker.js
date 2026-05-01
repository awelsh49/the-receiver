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
    .replace(/\bnegative\b/g, "-")
    .replace(/[,\n\r\t/|;:]+/g, " ")
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
 * Longitude: 124 west, written either as 124 W or -124.
 *
 * Also accepts 128 W right now because it was used in testing.
 * Remove "128" from ACCEPTED_SIGNAL_02_LONGITUDES if you only want 124 W.
 */
const ACCEPTED_SIGNAL_02_LONGITUDES = ["124", "128"];

function hasSignal02Latitude(value) {
  const normalized = normalizeResponse(value);

  const latitudePatterns = [
    /\b48\.2\s*(?:n|north)\b/,      // 48.2 N
    /\b(?:n|north)\s*48\.2\b/,      // N 48.2
    /\blat(?:itude)?\s*48\.2\b/    // lat 48.2
  ];

  return latitudePatterns.some((pattern) => pattern.test(normalized));
}

function hasSignal02Longitude(value) {
  const normalized = normalizeResponse(value);

  return ACCEPTED_SIGNAL_02_LONGITUDES.some((longitude) => {
    const escapedLongitude = longitude.replace(".", "\\.");

    const longitudePatterns = [
      new RegExp(`\\b-\\s*${escapedLongitude}\\s*(?:w|west)?\\b`),       // -124 or -124 W
      new RegExp(`\\b${escapedLongitude}\\s*(?:w|west)\\b`),             // 124 W
      new RegExp(`\\b(?:w|west)\\s*${escapedLongitude}\\b`),             // W 124
      new RegExp(`\\blon(?:gitude)?\\s*-?\\s*${escapedLongitude}\\b`)    // lon -124
    ];

    return longitudePatterns.some((pattern) => pattern.test(normalized));
  });
}

function hasBareSignal02Coordinates(value) {
  const normalized = normalizeResponse(value);

  return ACCEPTED_SIGNAL_02_LONGITUDES.some((longitude) => {
    const escapedLongitude = longitude.replace(".", "\\.");

    const barePatterns = [
      new RegExp(`\\b48\\.2\\s+-\\s*${escapedLongitude}\\b`),      // 48.2 -124
      new RegExp(`\\b48\\.2\\s+${escapedLongitude}\\b`)            // 48.2 124
    ];

    return barePatterns.some((pattern) => pattern.test(normalized));
  });
}

/**
 * This intentionally accepts lots of human-entered variants:
 * - 48.2 N, -124 W
 * - 48.2 n -124 w
 * - 48.2N 124W
 * - N 48.2 W 124
 * - 48.2 north 124 west
 * - 48.2, -124
 * - 48.2 -124
 * - lat 48.2 lon -124
 * - 48.2 n negative 124 w
 */
function isSignal02CoordinateAnswer(value) {
  const normalized = normalizeResponse(value);

  const hasLatitude = hasSignal02Latitude(normalized);
  const hasLongitude = hasSignal02Longitude(normalized);
  const hasBareCoordinates = hasBareSignal02Coordinates(normalized);

  return (hasLatitude && hasLongitude) || hasBareCoordinates;
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
