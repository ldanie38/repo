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

  if (btn && input && colorInput && labelList) {
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
  // Helper: Add label to UI with Edit/Delete
  //
  function addLabelToUI(name, color) {
    const li = document.createElement("li");
    li.style.backgroundColor = color;
    li.style.color = getContrastColor(color);
    li.style.padding = "14px 22px";
    li.style.borderRadius = "12px";
    li.style.fontWeight = "bold";
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.justifyContent = "space-between";
    li.style.gap = "8px";

    const span = document.createElement("span");
    span.textContent = name;
    span.style.flex = "1";
    span.style.textAlign = "center";

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.textContent = "✏️";
    editBtn.style.border = "none";
    editBtn.style.background = "rgba(255,255,255,0.2)";
    editBtn.style.color = "#fff";
    editBtn.style.borderRadius = "6px";
    editBtn.style.cursor = "pointer";
    editBtn.title = "Edit label";

    editBtn.addEventListener("click", () => {
      const newName = prompt("Edit label name:", name);
      if (!newName || !newName.trim()) return;

      // Create a hidden color input to pick new color
      const tempColorInput = document.createElement("input");
      tempColorInput.type = "color";
      tempColorInput.value = color;
      tempColorInput.style.position = "fixed";
      tempColorInput.style.left = "-9999px";
      document.body.appendChild(tempColorInput);

      tempColorInput.addEventListener("input", () => {
        const newColor = tempColorInput.value;
        // Update UI
        span.textContent = newName.trim();
        li.style.backgroundColor = newColor;
        li.style.color = getContrastColor(newColor);

        // Optional: send update to backend
        fetch(`/api/labels/update/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            oldName: name,
            newName: newName.trim(),
            color: newColor
          })
        }).catch(console.error);

        // Update local vars
        name = newName.trim();
        color = newColor;

        document.body.removeChild(tempColorInput);
      });

      // Trigger the color picker
      tempColorInput.click();
    });

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.style.border = "none";
    deleteBtn.style.background = "rgba(255,255,255,0.2)";
    deleteBtn.style.color = "#fff";
    deleteBtn.style.borderRadius = "6px";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.title = "Delete label";

    deleteBtn.addEventListener("click", () => {
      if (confirm(`Delete label "${name}"?`)) {
        li.remove();
        fetch(`/api/labels/delete/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name })
        }).catch(console.error);
      }
    });

    li.appendChild(span);
    li.appendChild(editBtn);
    li.appendChild(deleteBtn);
    labelList.appendChild(li);
  }

  //
  // Helper: Get contrast color (black or white) for readability
  //
  function getContrastColor(hex) {
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? "#000" : "#fff";
  }
});

  