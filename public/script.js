document.addEventListener("DOMContentLoaded", function () {
        if (window.location.search.includes("message=")) {
          // Small delay to ensure the alert is displayed first
          setTimeout(() => {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }, 100);
        }
      });