const ROUTES = {
  episodeOne: "./episode-1.html",
  episodes: "./episodes.html"
};

function navigateTo(url) {
  window.location.href = url;
}

function setSubmitState(isSubmitting) {
  const responseInput = document.querySelector("[data-response-input]");
  const submitButton = document.querySelector("[data-response-submit]");

  if (responseInput) {
    responseInput.disabled = isSubmitting;
  }

  if (submitButton) {
    submitButton.disabled = isSubmitting;
    submitButton.dataset.originalText ||= submitButton.textContent.trim();
    submitButton.textContent = isSubmitting ? "Listening..." : submitButton.dataset.originalText;
  }
}

function showSignalResult(result) {
  const failurePanel = document.querySelector("[data-failure-panel]");
  const successPanel = document.querySelector("[data-success-panel]");
  const responseInput = document.querySelector("[data-response-input]");
  const submitButton = document.querySelector("[data-response-submit]");

  if (failurePanel) failurePanel.hidden = true;
  if (successPanel) successPanel.hidden = true;

  if (result.accepted) {
    if (successPanel) successPanel.hidden = false;

    if (responseInput) responseInput.disabled = true;
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sent";
    }

    successPanel?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });

    return;
  }

  if (failurePanel) {
    const heading = failurePanel.querySelector("h2");
    const copy = failurePanel.querySelector("p");

    if (heading && result.title) heading.textContent = result.title;
    if (copy && result.message) copy.textContent = result.message;

    failurePanel.hidden = false;

    failurePanel.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  }
}

async function sendSignalResponse(responseText) {
  const response = await fetch("/api/signal-01/respond", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      response: responseText
    })
  });

  if (!response.ok) {
    throw new Error("Signal response failed.");
  }

  return response.json();
}

document.addEventListener("DOMContentLoaded", () => {
  const beginSeasonButton = document.querySelector('[data-action="begin-season"]');
  const viewEpisodesButton = document.querySelector('[data-action="view-episodes"]');

  beginSeasonButton?.addEventListener("click", () => {
    navigateTo(ROUTES.episodeOne);
  });

  viewEpisodesButton?.addEventListener("click", () => {
    navigateTo(ROUTES.episodes);
  });

  const responseForm = document.querySelector("[data-response-form]");
  const responseInput = document.querySelector("[data-response-input]");

  responseForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const responseText = responseInput?.value.trim() || "";

    if (!responseText) {
      showSignalResult({
        accepted: false,
        title: "The signal did not react",
        message: "It must be expecting something else."
      });
      return;
    }

    setSubmitState(true);

    try {
      const result = await sendSignalResponse(responseText);
      showSignalResult(result);

      if (!result.accepted) {
        setSubmitState(false);
      }
    } catch (error) {
      showSignalResult({
        accepted: false,
        title: "The receiver lost the signal",
        message: "Try again in a moment."
      });
      setSubmitState(false);
    }
  });
});
