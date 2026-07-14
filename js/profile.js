const KEY = "leprenom.parent";

export function getParent() {
  const v = localStorage.getItem(KEY);
  return v === "maman" || v === "papa" ? v : null;
}

export function setParent(p) {
  localStorage.setItem(KEY, p);
}

export function labelParent(p) {
  return p === "maman" ? "👩 Maman" : p === "papa" ? "👨 Papa" : "";
}
