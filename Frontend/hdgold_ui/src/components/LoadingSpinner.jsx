import React from 'react';

export const LoadingSpinner = ({ size = 40, text = '' }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div
        style={{
          width: size,
          height: size,
          border: '3px solid var(--dark-600)',
          borderTopColor: 'var(--gold-500)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      {text && <span style={{ color: 'var(--dark-200)', fontSize: '0.875rem' }}>{text}</span>}
    </div>
  );
};
