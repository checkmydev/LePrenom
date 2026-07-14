// Rend 10 étoiles dans `container`. onRate(note 1..10) appelé au clic.
export function renderStars(container, { value = 0, onRate } = {}) {
  container.classList.add("stars");
  container.innerHTML = "";
  const paint = (n) => [...container.children].forEach((s, i) =>
    s.classList.toggle("on", i < n));
  for (let i = 1; i <= 10; i++) {
    const s = document.createElement("span");
    s.className = "star";
    s.textContent = "★";
    s.addEventListener("mouseenter", () => paint(i));
    s.addEventListener("click", () => { paint(i); onRate && onRate(i); });
    container.appendChild(s);
  }
  container.addEventListener("mouseleave", () => paint(value));
  paint(value);
}
