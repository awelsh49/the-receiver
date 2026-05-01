const ROUTES = {
  episodeOne: "./episode-1.html",
  episodes: "./episodes.html"
};

function navigateTo(url) {
  window.location.href = url;
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
  const responseMessage = document.querySelector("[data-response-message]");
  const successPanel = document.querySelector("[data-success-panel]");

  responseForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const response = responseInput?.value.trim().toLowerCase() || "";

    responseMessage.classList.remove("is-error");
    responseMessage.textContent = "";

    if (!response.includes("how")) {
      responseMessage.classList.add("is-error");
      responseMessage.textContent = "The signal does not respond.";
      return;
    }

    responseInput.disabled = true;

    const submitButton = responseForm.querySelector("button");
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sent";
    }

    successPanel.hidden = false;

    responseMessage.classList.remove("is-error");
    responseMessage.textContent = "";
  });
});
