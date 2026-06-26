import urlCleaner from "./urlCleaner";

const NON_NAV_HREF_PREFIXES = ['javascript:', 'mailto:', 'tel:', '#']; // hrefs the link harvester skips

export const harvestAndCleanLinks = (): string[] => {
    const cleanLinks = new Set<string>();

    for (const anchor of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
        const raw = anchor.getAttribute('href') ?? '';
        
        if (NON_NAV_HREF_PREFIXES.some((prefix) => raw.startsWith(prefix))) continue;

        const clean = urlCleaner(anchor.href);
        
        cleanLinks.add(clean);
    }
    
    return Array.from(cleanLinks);
}