// 線條圖示（24×24，跟著文字顏色）。用法：icon('home')
const P = {
  home: '<path d="M3.5 10.5 12 4l8.5 6.5"/><path d="M5.5 9v10.5h13V9"/><path d="M10 19.5v-5h4v5"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  quiz: '<rect x="4.5" y="3.5" width="15" height="17" rx="2"/><path d="m8 9 1.5 1.5L12.5 7.5"/><path d="M14.5 9.5H16"/><path d="m8 15 1.5 1.5 3-3"/><path d="M14.5 15.5H16"/>',
  sound: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/>',
  verb: '<path d="M13 3 6 13.5h5.5L10.5 21 18 10h-5.5z"/>',
  book: '<path d="M4.5 5.5c2.5-1.3 5-1.3 7.5 0v14c-2.5-1.3-5-1.3-7.5 0z"/><path d="M12 5.5c2.5-1.3 5-1.3 7.5 0v14c-2.5-1.3-5-1.3-7.5 0"/>',
  hash: '<path d="M9.5 4 8 20"/><path d="M16 4l-1.5 16"/><path d="M4.5 9h15"/><path d="M4 15h15"/>',
  layers: '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
  chart: '<path d="M4.5 19.5h15"/><rect x="6" y="11" width="3" height="6" rx="1"/><rect x="10.5" y="6.5" width="3" height="10.5" rx="1"/><rect x="15" y="9" width="3" height="8" rx="1"/>',
  note: '<path d="M6 3.5h9l3.5 3.5v13.5H6z"/><path d="M14.5 3.5v4h4"/><path d="M9 12h6M9 15.5h6"/>',
  back: '<path d="m14.5 5.5-6.5 6.5 6.5 6.5"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
  bell: '<path d="M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5H5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  play: '<circle cx="12" cy="12" r="8.5"/><path d="m10.5 9 4.5 3-4.5 3z" fill="currentColor"/>',
  check: '<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/>',
  fire: '<path d="M12 3.5c.5 3-2.5 4.5-2.5 7.5a2.5 2.5 0 0 0 5 0c0-1-.4-1.8-.8-2.4 2.3 1.2 3.8 3.4 3.8 5.9a5.5 5.5 0 0 1-11 0c0-4.6 4.4-6.5 5.5-11z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  arrow: '<path d="M5 12h13"/><path d="m13 6.5 5.5 5.5-5.5 5.5"/>'
};
export const icon = (name, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || P.grid}</svg>`;
