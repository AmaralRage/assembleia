import { useEffect, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export const useModalFocus = (isOpen) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") return undefined;

    previousFocusRef.current = document.activeElement;
    const modal = modalRef.current;
    if (!modal) return undefined;

    const focusableElements = Array.from(
      modal.querySelectorAll(focusableSelector),
    ).filter((element) => !element.hasAttribute("disabled"));

    const firstFocusableElement = focusableElements[0];
    firstFocusableElement?.focus();

    const handleKeyDown = (event) => {
      if (event.key !== "Tab") return;

      const currentFocusableElements = Array.from(
        modal.querySelectorAll(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (!currentFocusableElements.length) {
        event.preventDefault();
        modal.focus();
        return;
      }

      const firstElement = currentFocusableElements[0];
      const lastElement =
        currentFocusableElements[currentFocusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  return modalRef;
};
