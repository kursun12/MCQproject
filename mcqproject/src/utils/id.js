let counter = Date.now();
export function generateId() {
  counter += 1;
  return counter;
}
