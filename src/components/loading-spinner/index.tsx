import React from 'react';

const LoadingSpinner: React.FC = React.memo(() => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
      <div className="min-w-[35px] min-h-[35px] bg-[url('/loading.gif')] bg-no-repeat bg-center bg-auto rounded-[50%]" />
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

export default LoadingSpinner;
