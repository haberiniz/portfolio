// Replace this URL after deploying the backend on Render.
const CONTACT_API_URL = "https://YOUR-BACKEND-NAME.onrender.com/api/contact";

const contactForm = document.getElementById("cform");
if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = document.getElementById("fbtn");
    const status = document.getElementById("fst");
    const data = new FormData(contactForm);

    const payload = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      subject: String(data.get("subject") || "").trim(),
      message: String(data.get("message") || "").trim(),
      website: String(data.get("website") || "").trim()
    };

    if (!payload.name || !payload.email || !payload.message) {
      status.textContent = "Please fill in your name, email, and message.";
      return;
    }

    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "";

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.message || "Could not send your message.");
      status.textContent = "Message sent successfully!";
      contactForm.reset();
    } catch (error) {
      status.textContent = error.message === "Failed to fetch"
        ? "Could not connect. Please try again in a moment."
        : (error.message || "Something went wrong. Please try again.");
    } finally {
      button.disabled = false;
      button.textContent = oldText;
    }
  });
}
