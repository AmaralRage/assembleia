import { useLocation } from 'react-router-dom';
import { useLayoutEffect } from 'react';

import { smoothScrollToElement } from '@/lib/smoothScroll';

const ScrollToTop = () => {
    const { hash, pathname } = useLocation();

    useLayoutEffect(() => {
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
