import React from 'react';

interface WithComma {
  items: React.ReactNode[];
}

export function WithComma({ items }: WithComma) {
  return (
    <>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item}
          {index < items.length - 1 && ', '}
        </React.Fragment>
      ))}
    </>
  );
}
