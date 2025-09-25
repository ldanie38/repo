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
