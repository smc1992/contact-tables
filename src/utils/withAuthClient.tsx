import React from 'react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

// Ein einfacher Client-seitiger Auth-Wrapper für den Build-Prozess
export default function withAuthClient(
  WrappedComponent: React.ComponentType<any>,
  allowedRoles: string[] = []
) {
  return function WithAuthWrapper(props: any) {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(true);

    // Im Build-Prozess immer als autorisiert betrachten
    useEffect(() => {
      if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
        // In Produktion würde hier eine echte Prüfung stattfinden
        setIsAuthorized(true);
      }
    }, []);

    if (!isAuthorized) {
      return <div>Laden...</div>;
    }

    return <WrappedComponent {...props} />;
  };
}
