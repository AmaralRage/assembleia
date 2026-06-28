import React from 'react';

import { cn } from '@/lib/utils';

const SectionHeading = ({
  eyebrow,
  title,
  highlight,
  description,
  as: Tag = 'h2',
  align = 'left',
  className,
  titleClassName,
  descriptionClassName,
  eyebrowClassName,
  highlightClassName,
  highlightLeadingSpace = true,
}) => {
  const isCentered = align === 'center';
  const isRight = align === 'right';

  return (
    <div
      className={cn(
        isCentered && 'text-center',
        isRight && 'text-right',
        className,
      )}
    >
      {eyebrow && (
        <p
          className={cn(
            'mb-4 text-xs font-bold uppercase tracking-[0.32em] text-primary',
            eyebrowClassName,
          )}
        >
          {eyebrow}
        </p>
      )}
      <Tag
        className={cn(
          'text-4xl font-bold leading-tight text-foreground md:text-6xl',
          isCentered && 'mx-auto',
          titleClassName,
        )}
      >
        {title}
        {highlight && (
          <>
            {highlightLeadingSpace && ' '}
            <span
              className={cn(
                'bg-[linear-gradient(90deg,hsl(var(--primary))_0%,hsl(var(--primary))_42%,#60a5fa_70%,#93c5fd_100%)] bg-clip-text text-transparent',
                highlightClassName,
              )}
            >
              {highlight}
            </span>
          </>
        )}
      </Tag>
      {description && (
        <p
          className={cn(
            'mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg',
            isCentered && 'mx-auto',
            isRight && 'ml-auto',
            descriptionClassName,
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default SectionHeading;
