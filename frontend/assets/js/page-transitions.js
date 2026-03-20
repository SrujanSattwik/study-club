document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Enter Animation:
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Apply entry transition state immediately (invisible)
    document.body.classList.add('page-transitioning');
    
    // Force reflow to ensure the initial state is applied
    void document.body.offsetHeight;
    
    // Remove the class to trigger the enter animation smoothly
    requestAnimationFrame(() => {
        document.body.classList.remove('page-transitioning');
    });

    // 2. Intercept Link Clicks for Exit Animations
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target) return;

        const href = target.getAttribute('href');
        if (!href) return;

        // Skip conditions:
        const isExternal = target.hostname && target.hostname !== window.location.hostname;
        const isBlank = target.getAttribute('target') === '_blank';
        const isAnchor = href.startsWith('#') || href.includes(window.location.pathname + '#');
        const isModifier = e.ctrlKey || e.metaKey || e.shiftKey || e.altKey;
        const isSpecialProtocol = href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:');

        if (isExternal || isBlank || isAnchor || isModifier || isSpecialProtocol) return;

        e.preventDefault();

        // Start exit animation
        document.body.classList.add('page-transitioning');

        // Navigation callback
        let transitioned = false;
        const navigate = () => {
            if (!transitioned) {
                transitioned = true;
                window.location.href = href;
            }
        };

        // Listen for the exact transition ending
        const onTransitionEnd = (evt) => {
            if (evt && evt.target !== document.body) return; // Ignore child elements
            document.body.removeEventListener('transitionend', onTransitionEnd);
            navigate();
        };

        document.body.addEventListener('transitionend', onTransitionEnd);
        
        // Fallback timeout in case transitionend is missed (e.g. element hidden or no transition property)
        const duration = prefersReducedMotion ? 300 : 450; 
        setTimeout(navigate, duration);
    });

    // 3. Handle Back/Forward Cache (bfcache) Restores
    window.addEventListener('pageshow', (e) => {
        if (e.persisted || document.body.classList.contains('page-transitioning')) {
            // Document pulled from bfcache or stuck in transition state
            requestAnimationFrame(() => {
                document.body.classList.remove('page-transitioning');
            });
        }
    });

    // 4. Prefetching on Hover for Zero-Delay Navigation
    const prefetchedUrls = new Set();
    
    document.addEventListener('mouseover', (e) => {
        const target = e.target.closest('a');
        if (!target) return;
        
        const href = target.getAttribute('href');
        // Only prefetch internal, relative, non-hashed links
        if (
            href && 
            !href.startsWith('#') && 
            !href.startsWith('http') && 
            !href.startsWith('mailto:') &&
            !href.startsWith('tel:') &&
            !target.getAttribute('target') && 
            !prefetchedUrls.has(href)
        ) {
            prefetchedUrls.add(href);
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        }
    });
});
