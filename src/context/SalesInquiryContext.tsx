import React, { createContext, useContext, useMemo, useState } from 'react';

interface SalesSourceContext {
  sourcePage: string;
  ctaClicked: string;
  campaignSource: string;
}

interface OpenSalesOptions {
  sourcePage?: string;
  ctaClicked?: string;
  campaignSource?: string;
  interestArea?: string;
}

interface SalesInquiryContextType {
  isOpen: boolean;
  source: SalesSourceContext;
  interestArea: string;
  openSales: (options?: OpenSalesOptions) => void;
  closeSales: () => void;
}

const defaultSource: SalesSourceContext = {
  sourcePage: '/',
  ctaClicked: 'unknown',
  campaignSource: '',
};

const SalesInquiryContext = createContext<SalesInquiryContextType | null>(null);

export const SalesInquiryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [source, setSource] = useState<SalesSourceContext>(defaultSource);
  const [interestArea, setInterestArea] = useState('');

  const openSales = (options?: OpenSalesOptions) => {
    const search = new URLSearchParams(window.location.search);
    setSource({
      sourcePage: options?.sourcePage || window.location.pathname,
      ctaClicked: options?.ctaClicked || 'unknown',
      campaignSource: options?.campaignSource || search.get('utm_source') || '',
    });
    setInterestArea(options?.interestArea || '');
    setIsOpen(true);
  };

  const closeSales = () => setIsOpen(false);

  const value = useMemo(() => ({
    isOpen,
    source,
    interestArea,
    openSales,
    closeSales,
  }), [isOpen, source, interestArea]);

  return (
    <SalesInquiryContext.Provider value={value}>
      {children}
    </SalesInquiryContext.Provider>
  );
};

export const useSalesInquiry = (): SalesInquiryContextType => {
  const ctx = useContext(SalesInquiryContext);
  if (!ctx) throw new Error('useSalesInquiry must be used within <SalesInquiryProvider>');
  return ctx;
};
