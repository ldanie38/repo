
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("createLabelBtn");
  const input = document.getElementById("newLabelInput");

  btn.addEventListener("click", async () => {
    const labelName = input.value.trim();
    if (!labelName) {
      alert("Please enter a label name");
      return;
    }

    try {
      const res = await fetch("/api/labels/create/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: labelName })
      });

      const data = await res.json();
      console.log(data);

      if (res.ok) {
        alert(`Label "${data.name}" created!`);
        input.value = "";
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  });
});
