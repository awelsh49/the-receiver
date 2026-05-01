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
});
