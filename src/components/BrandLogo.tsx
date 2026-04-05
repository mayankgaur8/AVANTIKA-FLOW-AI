import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

interface BrandLogoProps {
  to?: string;
  className?: string;
  imageClassName?: string;
  iconOnly?: boolean;
  wordmarkClassName?: string;
  logoSrc?: string;
}

const FALLBACK_LOGO_SRC = '/brand/avantika-logo.png';

const FallbackMark = () => (
  <div
    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
  >
    <span className="text-white font-black text-sm leading-none select-none">A</span>
  </div>
);

export const BrandLogo = ({
  to = '/',
  className = '',
  imageClassName = 'h-10 w-10 object-cover object-top rounded-xl ring-1 ring-white/20 shadow-[0_0_18px_rgba(96,165,250,0.32)]',
  iconOnly = false,
  wordmarkClassName = '',
  logoSrc,
}: BrandLogoProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const resolvedSrc = useMemo(() => logoSrc || FALLBACK_LOGO_SRC, [logoSrc]);

  return (
    <Link to={to} className={`flex items-center gap-2.5 min-w-0 ${className}`} aria-label="Avantika Flow AI home">
      {!imageFailed ? (
        <>
          <img
            src={resolvedSrc}
            alt="Avantika Flow AI"
            className={imageClassName}
            onError={() => setImageFailed(true)}
          />
          {!iconOnly && wordmarkClassName ? (
            <span className={wordmarkClassName}>Avantika Flow AI</span>
          ) : null}
        </>
      ) : (
        <FallbackMark />
      )}
    </Link>
  );
};