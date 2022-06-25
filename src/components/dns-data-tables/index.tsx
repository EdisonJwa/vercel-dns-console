import { useCallback, useMemo } from 'react';
import { Badge, Code, Text, Tooltip, useTheme } from '@geist-ui/core';

import { DataTable, type DataTableFilterRenderer, type DataTableColumns, DataTableProps } from '../data-tables';

import { generateDnsDescription } from '@/lib/generate-dns-description';
import { EMPTY_ARRAY } from '@/lib/constant';

import { useVercelListDNSRecords } from '@/hooks/use-vercel-dns';

import MoreVertical from '@geist-ui/icons/moreVertical';
import InfoFill from '@geist-ui/icons/infoFill';

import { Menu, MenuItem } from '../menu';
import { CopyButton } from '../copy-button';

import type { VercelDNSRecord } from '@/types/dns';
import type { CellProps, FilterType, FilterTypes } from 'react-table';
import { DNSDataTableFilter } from './filter';

export interface RecordItem {
  id: string,
  slug: string,
  name: string,
  type: VercelDNSRecord['type'],
  priority?: number,
  value: string,
  ttl: number,
  createdAt: number | null,
  updatedAt: number | null,
  isSystem: boolean,
  disableSelection?: boolean;
}

export const DNSDataTables = (props: {
  domain: string | undefined
}) => {
  const theme = useTheme();

  const { data: rawData, isLoading } = useVercelListDNSRecords(props.domain);
  const records: RecordItem[] = useMemo(() => {
    const result: RecordItem[] = [];

    if (!rawData) {
      return result;
    }
    // Array.prototype.flat() is way too new and its polyfill is not included in Next.js
    rawData.forEach(page => {
      page.records.forEach(record => {
        result.push({
          id: record.id,
          slug: record.slug,
          name: record.name,
          type: record.type,
          value: record.value,
          priority: record.mxPriority ?? record.priority,
          ttl: record.ttl,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
          isSystem: record.creator === 'system',
          disableSelection: record.creator === 'system'
        });
      });
    });

    // sort by updatedAt
    return result.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  }, [rawData]);

  const columns: DataTableColumns<RecordItem>[] = useMemo(() => [
    {
      Header: 'Name',
      accessor: 'name',
      width: 300,
      minWidth: 300,
      maxWidth: 300,
      ellipsis: true,
      filter: 'searchInRecordNameAndValue',
      Cell({ value }) {
        if (value.length > 10) {
          return (
            <Tooltip
              text={(
                <>
                  <Code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{value}</Code>
                  <CopyButton auto scale={1 / 4} ml={1} copyValue={value} />
                </>
              )}
              // visible
              placement="bottomStart"
              className="dns-data-tables__tooltip table-cell-ellipsis"
              portalClassName="table-cell-tooltip-portal record"
              offset={5}
            >
              {value}
            </Tooltip>
          );
        }
        return <>{value}</>;
      }
    },
    {
      Header: 'Type',
      accessor: 'type',
      width: 80,
      minWidth: 80,
      maxWidth: 80,
      filter: 'searchInRecordType'
    },
    {
      Header: 'Priority',
      accessor: 'priority',
      width: 80,
      minWidth: 80,
      maxWidth: 80
    },
    {
      Header: 'Value',
      accessor: 'value',
      width: 350,
      minWidth: 350,
      maxWidth: 350,
      ellipsis: true,
      filter: 'searchInRecordNameAndValue',
      Cell({ value }) {
        return (
          <Tooltip
            text={(
              <>
                <Code style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{value}</Code>
                <CopyButton auto scale={1 / 4} ml={1} copyValue={value} />
              </>
            )}
            placement="bottomStart"
            className="dns-data-tables__tooltip table-cell-ellipsis"
            portalClassName="table-cell-tooltip-portal record-value"
            // visible
            offset={5}
          >
            {value}
          </Tooltip>
        );
      }
    },
    {
      Header: 'TTL',
      accessor: 'ttl',
      width: 80,
      minWidth: 80,
      maxWidth: 80
    },
    {
      id: 'dns-description-tooltip',
      Header: '',
      width: 30,
      minWidth: 30,
      maxWidth: 30,
      Cell({ row }: CellProps<RecordItem, any>) {
        const record = row.original;
        if (props.domain) {
          return (
            <Tooltip
              text={
                <div className="description">
                  {
                    generateDnsDescription(
                      props.domain,
                      record.name,
                      record.value,
                      record.type
                    )
                  }
                </div>
              }
              className="table-cell-tooltip"
              portalClassName="table-cell-tooltip-portal record-description"
              offset={5}
              // visible
              placement="bottomEnd"
            >
              <InfoFill color={theme.palette.accents_3} size={12} />
            </Tooltip>
          );
        }

        return (
          <InfoFill color={theme.palette.accents_3} size={12} />
        );
      }
    }
  ], [props.domain, theme.palette.accents_3]);

  const renderHeaderAction = useCallback((selected: RecordItem[]) => {
    return (

      <Menu
        itemMinWidth={120}
        content={(
          <MenuItem>
            <Text span type={selected.length ? 'error' : 'secondary'}>
              Delete ({selected.length})
            </Text>
          </MenuItem>
        )}
      >
        <Badge.Anchor>
          {selected.length > 0 && <Badge style={{ userSelect: 'none' }} scale={1 / 3}>{selected.length}</Badge>}
          <MoreVertical className="record-menu-trigger" color={theme.palette.accents_3} size={16} />
        </Badge.Anchor>
      </Menu>
    );
  }, [theme.palette.accents_3]);

  const renderRowAction = useCallback((record: RecordItem) => {
    return (
      <Menu
        itemMinWidth={100}
        content={(
          <>
            <MenuItem>
              <Text span>
                Edit
              </Text>
            </MenuItem>
            <MenuItem>
              <Text span type="error">
                Delete
              </Text>
            </MenuItem>
          </>
        )}
      >
        <MoreVertical className="record-menu-trigger" color={theme.palette.accents_3} size={16} />
      </Menu>
    );
  }, [theme.palette.accents_3]);

  const renderFilter: DataTableFilterRenderer<RecordItem> = useCallback((setFilter, setGlobalFilter) => (
    <DNSDataTableFilter setFilter={setFilter} setGlobalFilter={setGlobalFilter} />
  ), []);

  const searchInRecordTypeFilterFn: FilterType<RecordItem> = useCallback((rows, columnIds, filterValue) => {
    if (!filterValue) return rows;
    return rows.filter(row => row.original.type === filterValue);
  }, []);

  const searchInRecordNameAndValueFilterFn: FilterType<RecordItem> = useCallback((rows, columnIds, filterValue) => {
    if (typeof filterValue === 'string') {
      const query = filterValue.toLowerCase();
      return rows.filter(row => row.original.value.toLowerCase().includes(query) || row.original.name.toLowerCase().includes(query));
    }
    return rows;
  }, []);

  const filterTypes: FilterTypes<RecordItem> = useMemo(() => ({
    searchInRecordType: searchInRecordTypeFilterFn,
    searchInRecordNameAndValue: searchInRecordNameAndValueFilterFn
  }), [searchInRecordTypeFilterFn, searchInRecordNameAndValueFilterFn]);

  const isDataTablePlaceHolder = useMemo(() => {
    if (props.domain) {
      if (!isLoading) {
        return false;
      }
    }

    return true;
  }, [isLoading, props.domain]);

  const dataTableProps: DataTableProps<RecordItem> = isDataTablePlaceHolder
    ? {
      placeHolder: 4,
      data: EMPTY_ARRAY,
      columns,
      renderHeaderAction,
      renderFilter
    }
    : {
      data: records,
      columns,
      renderHeaderAction,
      renderRowAction,
      renderFilter,
      tableOptions: {
        filterTypes
      }
    };

  return (
    <div>
      <DataTable {...dataTableProps} />
      <style jsx>{`
        div {
          width: 100%;
        }

        @media screen and (max-width: ${theme.breakpoints.sm.max}) {
          :global(div.table-cell-tooltip-portal.table-cell-tooltip-portal) {
            width: 200px;
          }
        }

        @media screen and (min-width: ${theme.breakpoints.sm.min}) {
          :global(.table-cell-tooltip-portal.record) {
            max-width: 400px;
          }
          :global(.table-cell-tooltip-portal.record-value) {
            max-width: 400px;
          }
          :global(.table-cell-tooltip-portal.record-description) {
            min-width: 400px;
          }
        }

        div :global(.table-cell-ellipsis) {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow-wrap: break-word;
          word-break: keep-all;
        }
        div :global(.table-cell-tooltip.table-cell-tooltip) {
          display: inline-flex
        }

        :global(.dns-data-tables__tooltip) {
          width: 100%;
        }

        div :global(td .tooltip) {
          width: 100%;
        }

        :global(.table-cell-tooltip-portal) :global(.inner.inner) {
          font-size: 13px;
          display: flex;
          align-items: center;
        }

        @media (max-width: 1050px) {
          :global(.table-cell-tooltip-portal) {
            max-width: ${theme.layout.breakpointTablet}
          }
        }
      `}</style>
    </div>
  );
};
