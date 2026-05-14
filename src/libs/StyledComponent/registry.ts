const styleCache = new Map<string, string>();
let classCounter = 0;

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export function registerStyles(cssString: string): string {
  if (styleCache.has(cssString)) {
    return styleCache.get(cssString)!;
  }

  const className = `css-${hashString(cssString)}-${classCounter++}`;
  styleCache.set(cssString, className);

  const rule = `.${className} { ${cssString} }`;

  let styleElement = document.querySelector('style[data-styled]') as HTMLStyleElement;
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.setAttribute('data-styled', 'true');
    document.head.appendChild(styleElement);
  }

  styleElement.textContent += rule;
  return className;
}