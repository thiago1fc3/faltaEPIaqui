export function debounce(fn, time) {
  let t;
  return function (...args) {
    clearInterval(t);
    t = setTimeout(fn.bind(this), time, ...args);
  };
}
