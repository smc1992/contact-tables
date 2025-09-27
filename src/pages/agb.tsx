import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AGB() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/terms-conditions');
  }, [router]);

  return null;
}