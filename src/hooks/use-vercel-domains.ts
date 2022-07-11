import { useToasts } from '@geist-ui/core';
import { useMemo } from 'react';
import useSWR from 'swr';
import { fetcherWithAuthorization, HTTPError } from '../lib/fetcher';
import { VercelDomainResponse } from '../types/domains';
import { useVercelApiToken } from './use-vercel-api-token';

export const useVercelDomains = () => {
  const [token] = useVercelApiToken();
  const { setToast } = useToasts();

  return useSWR<VercelDomainResponse, HTTPError>(
    token
      ? ['/v5/domains', token]
      : null,
    fetcherWithAuthorization,
    {
      onError() {
        setToast({
          type: 'error',
          text: 'Failed to load domains list',
          delay: 3000
        });
      }
    }
  );
};

export const useVercelDomainInfo = (domain: string | undefined) => {
  const { data } = useVercelDomains();

  return useMemo(() => {
    if (data) {
      return data.domains.find((d) => d.name === domain);
    }

    return undefined;
  }, [data, domain]);
};
