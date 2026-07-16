import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

import { cancelSmoothScroll, smoothScrollToElement } from '@/lib/smoothScroll';

const ScrollToTop = () => {
    const { hash, pathname } = useLocation();

    useLayoutEffect(() => {
      // A route change can happen while a smooth scroll from the previous page
      // is still running. Cancel it first so it cannot move the new page away
      // from the top on the next animation frame.
      cancelSmoothScroll();

      if (hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        window.requestAnimationFrame(() => {
          const element = document.querySelector(hash);
          smoothScrollToElement(element);
        });
        return;
      }

        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }, [hash, pathname]);

    return null;
}

export default ScrollToTop;
