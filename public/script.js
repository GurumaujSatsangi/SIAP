document.addEventListener("DOMContentLoaded", function () {
        if (window.location.search.includes("message=")) {
          setTimeout(() => {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname
            );
          }, 100);
        }
});

document.addEventListener("DOMContentLoaded", function () {
  function updateHostelBlock() {
    const dayscholar = document.getElementById("residence_type_dayscholar");
    const hostelBlock = document.getElementById("hostelblock");
    if (!hostelBlock) return; 
    if (dayscholar) {
      hostelBlock.disabled = dayscholar.checked;
      return;
    }
    const radios = document.querySelectorAll('input[name="residence_type"]');
    if (radios && radios.length) {
      const selected = Array.from(radios).find((r) => r.checked);
      if (selected) {
        hostelBlock.disabled = selected.value === "dayscholar";
      }
    }
  }
  updateHostelBlock();
  const dayscholarEl = document.getElementById("residence_type_dayscholar");
  if (dayscholarEl) dayscholarEl.addEventListener("change", updateHostelBlock);
  const radios = document.querySelectorAll('input[name="residence_type"]');
  radios.forEach((r) => r.addEventListener("change", updateHostelBlock));
});