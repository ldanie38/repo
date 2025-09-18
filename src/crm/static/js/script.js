document.addEventListener("DOMContentLoaded", () => {
  //
  // Show Labels toggle
  //
  const showToggle = document.getElementById("showLabelsToggle");
  if (showToggle) {
    showToggle.addEventListener("change", function () {
      console.log(this.checked ? "Labels ON" : "Labels OFF");
      // Optional: persist or send message to extension
    });
  }

  //
  // Drag & Drop for .feature items
  //
  const featuresContainer = document.querySelector(".features");
  if (featuresContainer) {
    const featureItems = document.querySelectorAll(".feature");

    featureItems.forEach((item) => {
      item.setAttribute("draggable", "true");
      item.addEventListener("dragstart", () => item.classList.add("dragging"));
      item.addEventListener("dragend", () => item.classList.remove("dragging"));
    });

    featuresContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(featuresContainer, e.clientY);
      const dragging = document.querySelector(".dragging");
      if (!afterElement) {
        featuresContainer.appendChild(dragging);
      } else {
        featuresContainer.insertBefore(dragging, afterElement);
      }
    });

    function getDragAfterElement(container, y) {
      const draggableElements = [
        ...container.querySelectorAll(".feature:not(.dragging)"),
      ];
      return draggableElements.reduce(
        (closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
          }
          return closest;
        },
        { offset: Number.NEGATIVE_INFINITY }
      ).element;
    }
  }

  //
  // Brush icon color picker
  //
  const colorInput = document.getElementById("newLabelColorInput");
  const brushIcon = document.querySelector(".brush-icon");
  if (colorInput && brushIcon) {
    brushIcon.addEventListener("click", () => colorInput.click());
    colorInput.addEventListener("input", () => {
      brushIcon.style.color = colorInput.value;
    });
  }

  //
  // Create Label (name + color) and render instantly
  //
  const btn = document.getElementById("createLabelBtn");
  const input = document.getElementById("newLabelInput");
  const labelList = document.getElementById("labelList"); // UL container in HTML

  if (btn && input && colorInput) {
    btn.addEventListener("click", async () => {
      const labelName = input.value.trim();
      const labelColor = colorInput.value;

      if (!labelName) {
        alert("Please enter a label name");
        return;
      }

      try {
        const res = await fetch("/api/labels/create/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: labelName, color: labelColor }),
        });

        const data = await res.json();

        if (res.ok) {
          addLabelToUI(data.name, data.color);

          // Reset form
          input.value = "";
          colorInput.value = "#ff0000";
          brushIcon.style.color = "#ff0000";
        } else {
          alert(`Error: ${data.error}`);
        }
      } catch (err) {
        console.error(err);
        alert("Something went wrong");
      }
    });
  }

  //
  // Load existing labels on page load
  //
  if (labelList) {
    loadLabels();
  }

  async function loadLabels() {
    try {
      const res = await fetch("/api/labels/");
      if (!res.ok) return;
      const labels = await res.json();
      labels.forEach((label) => {
        addLabelToUI(label.name, label.color);
      });
    } catch (err) {
      console.error("Error loading labels:", err);
    }
  }

  //
  // Helper: Add label to UI
  //
  function addLabelToUI(name, color) {
    const li = document.createElement("li");
    li.textContent =(name);              // ✅ show label name, not color code
    li.style.backgroundColor = color;   // ✅ use color for background
    li.style.color = getContrastColor(color);
    li.style.padding = "14px 22px";
    li.style.borderRadius = "12px";
    li.style.fontWeight = "bold";
    labelList.appendChild(li);
  }
  

  //
  // Helper: Choose black or white text for contrast
  //
  function getContrastColor(hex) {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? "#000" : "#fff";
  }
});
