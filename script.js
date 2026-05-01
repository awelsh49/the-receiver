const ROUTES = {
  episodeOne: "./episode-1.html",
  episodes: "./episodes.html"
};

function navigateTo(url) {
  window.location.href = url;
}

function setSubmitState(form, isSubmitting) {
  const responseInput = form.querySelector("[data-response-input]");
  const submitButton = form.querySelector("[data-response-submit]");

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
    if (successPanel) {
      const successHeading = successPanel.querySelector(".reaction-copy h2");
      const successCopy = successPanel.querySelector(".reaction-copy p");
      const successLink = successPanel.querySelector(".signal-02-link");

      if (successHeading && result.title) successHeading.textContent = result.title;
      if (successCopy && result.message) successCopy.textContent = result.message;

      if (successLink && result.unlock) {
        successLink.href = result.unlock.href || successLink.href;

        const linkText = successLink.querySelector("span:first-child");
        if (linkText && result.unlock.label) {
          linkText.textContent = result.unlock.label;
        }
      }

      successPanel.hidden = false;
    }

    if (responseInput) responseInput.disabled = true;

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sent";
    }

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

async function sendSignalResponse(endpoint, responseText) {
  const response = await fetch(endpoint, {
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

  responseForm?.addEventListener("submit", async (event) => {
    event.preventDefault();

    const responseInput = responseForm.querySelector("[data-response-input]");
    const responseText = responseInput?.value.trim() || "";
    const endpoint = responseForm.dataset.signalEndpoint || "/api/signal-01/respond";

    if (!responseText) {
      showSignalResult({
        accepted: false,
        title: "The signal did not react",
        message: "It must be expecting something else."
      });
      return;
    }

    setSubmitState(responseForm, true);

    try {
      const result = await sendSignalResponse(endpoint, responseText);
      showSignalResult(result);

      if (!result.accepted) {
        setSubmitState(responseForm, false);
      }
    } catch (error) {
      showSignalResult({
        accepted: false,
        title: "The receiver lost the signal",
        message: "Try again in a moment."
      });
      setSubmitState(responseForm, false);
    }
  });

  const successCloseButtons = document.querySelectorAll("[data-success-close]");
  const successPanel = document.querySelector("[data-success-panel]");

  successCloseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (successPanel) {
        successPanel.hidden = true;
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && successPanel && !successPanel.hidden) {
      successPanel.hidden = true;
    }
  });
});
