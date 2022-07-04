import React, { forwardRef, useCallback, useEffect, useMemo } from 'react';

import { Text, Link, useTheme, Spacer, Note } from '@geist-ui/core';
import NextLink from 'next/link';
import NextHead from 'next/head';

import { Layout } from '@/components/layout';
import { DataTable, type DataTableColumns } from '../components/data-tables';
import { Notice } from '@/components/notice';

import { useVercelDomains } from '@/hooks/use-vercel-domains';
import { useToasts } from '@/hooks/use-toasts';
import { formatDate } from '../lib/util';

import MoreVertical from '@geist-ui/icons/moreVertical';

import type { NextPageWithLayout } from '@/pages/_app';
import { Menu, MenuItem } from '../components/menu';

interface DomainItem {
  name: string;
  nameServer: string,
  createdAt: string;
}

const DomainLink = forwardRef((props: { name: string }, ref: React.ForwardedRef<HTMLAnchorElement>) => {
  return (
    <>
      <NextLink href={`/domain/${props.name}`} prefetch={false} passHref>
        <Link ref={ref} className="domain">{props.name}</Link>
      </NextLink>
    </>
  );
});

if (process.env.NODE_ENV !== 'production') {
  DomainLink.displayName = 'DomainLink';
}

const domainDataTableColumns: DataTableColumns<DomainItem>[] = [
  {
    accessor: 'name',
    Header: 'Domain',
    Cell: ({ value }) => (
      <DomainLink name={value} />
    )
  },
  {
    accessor: 'nameServer',
    Header: 'NameServer',
    cellClassName: 'nameserver-cell'
  },
  {
    accessor: 'createdAt',
    Header: 'Created At',
    cellClassName: 'created-cell'
  }
];

const DomainsPage: NextPageWithLayout = () => {
  const { setToast, clearToasts } = useToasts();
  const theme = useTheme();
  const { data, error } = useVercelDomains();
  const hasError = useMemo(() => !!error, [error]);

  useEffect(() => {
    if (hasError) {
      setToast({
        type: 'error',
        text: 'Failed to load domains list',
        delay: 3000
      });

      return () => {
        clearToasts();
      };
    }
  }, [hasError, setToast, clearToasts]);

  const processedDomainLists: DomainItem[] = useMemo(() => {
    if (!data) return [];

    return data.domains.map(domain => {
      return {
        name: domain.name,
        nameServer: domain.serviceType === 'zeit.world' ? 'Vercel' : 'Third Party',
        createdAt: formatDate(domain.createdAt)
      };
    });
  }, [data]);

  const renderDataTableMenu = useCallback((value: DomainItem) => (
    <Menu
      itemMinWidth={180}
      style={{ justifyContent: 'flex-end' }}
      content={(
        <MenuItem>
          <NextLink href={`/domain/${value.name}`} prefetch={false}>
            <Link>
              Manage DNS Records
            </Link>
          </NextLink>
        </MenuItem>
      )}
    >
      <MoreVertical color={theme.palette.accents_3} size={16} />
    </Menu>
  ), [theme.palette.accents_3]);

  return (
    <div>
      <NextHead>
        <title>Domains</title>
      </NextHead>
      <Text h1>Domains</Text>
      <Note type="warning">
        You can only manage your DNS records here. Please go to
        {' '}
        <Link
          href="https://vercel.com"
          target="_blank"
          rel="external nofollow noreferrer noopenner"
          icon
          color
          underline
        >
          https://vercel.com
        </Link>
        {' '}
        to buy / transfer / renew / add / remove your domains.
      </Note>
      <Spacer h={2} />
      <DataTable
        placeHolder={!error && !data ? 4 : false}
        data={processedDomainLists}
        columns={domainDataTableColumns}
        renderRowAction={renderDataTableMenu}
      />
      {
        data && <Notice />
      }
      <style jsx>{`
       div :global(.domain) {
         border-bottom: 1px dashed ${theme.palette.accents_3};
       }

       @media screen and (max-width: 475px) {
          div :global(.nameserver-cell),
          div :global(.created-cell) {
            display: none;
          }
       }
      `}</style>
    </div>
  );
};

DomainsPage.getLayout = (children, prop) => {
  return (
    <Layout>
      {children}
    </Layout>
  );
};

export default DomainsPage;
