/** 图片加载失败时的内联占位图（data URI 不会再发起网络请求） */
export const IMAGE_FALLBACK =
  'data:image/svg+xml;charset=UTF-8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750" viewBox="0 0 600 750">
  <rect width="600" height="750" fill="#e7dfd1"/>
  <g fill="none" stroke="#9b8f7c" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="170" y="250" width="260" height="200" rx="10"/>
    <circle cx="245" cy="325" r="26"/>
    <path d="M190 425l85-85 60 60 45-40 40 40v35H190z"/>
  </g>
  <text x="300" y="505" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#7a6f5e">图片暂不可用</text>
</svg>`.trim());
