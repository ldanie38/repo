import { getLabels } from "./storage.js";

document.addEventListener("DOMContentLoaded", () => {
  const list = document.getElementById("labelList");

  function render() {
    getLabels((labels) => {
      list.innerHTML = "";
      labels.forEach((l) => {
        const li = document.createElement("li");
        li.textContent = l.name; // 👈 show the label name
        li.style.backgroundColor = l.color || "#777"; // optional: color styling
        li.style.color = getContrastColor(l.color || "#777");
        li.style.padding = "10px 12px";
        li.style.borderRadius = "8px";
        li.style.fontWeight = "600";
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.justifyContent = "space-between";
        li.style.gap = "8px";
        list.appendChild(li);
      });
    });
  }

  render();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.labels) render();
  });
});

// Returns black or white depending on background brightness
function getContrastColor(hex) {
  if (!hex) return "#000";
  const c = hex.substring(1); // strip #
  const rgb = parseInt(c, 16); // convert rrggbb to decimal
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b; // perceptual brightness
  return luma > 186 ? "#000000" : "#ffffff";
}

