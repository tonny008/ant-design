'use client';

import classNames from 'classnames';
// eslint-disable-next-line import/no-named-as-default
import * as React from 'react';
import extendsObject from '../_util/extendsObject';
import type { Breakpoint } from '../_util/responsiveObserver';
import { responsiveArray } from '../_util/responsiveObserver';
import { ConfigContext } from '../config-provider';
import DefaultRenderEmpty from '../config-provider/defaultRenderEmpty';
import { Row } from '../grid';
import useBreakpoint from '../grid/hooks/useBreakpoint';
import type { PaginationConfig } from '../pagination';
import Pagination from '../pagination';
import type { SpinProps } from '../spin';
import Spin from '../spin';
import Item from './Item';

// CSSINJS
import { ListContext } from './context';
import useStyle from './style';

export type { ListItemMetaProps, ListItemProps } from './Item';
export type { ListConsumerProps } from './context';

export type ColumnCount = number;

export type ColumnType = 'gutter' | 'column' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export interface ListGridType {
  gutter?: number;
  column?: ColumnCount;
  xs?: ColumnCount;
  sm?: ColumnCount;
  md?: ColumnCount;
  lg?: ColumnCount;
  xl?: ColumnCount;
  xxl?: ColumnCount;
}

export type ListSize = 'small' | 'default' | 'large';

export type ListItemLayout = 'horizontal' | 'vertical';

export interface ListProps<T> {
  bordered?: boolean;
  className?: string;
  rootClassName?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  dataSource?: T[];
  extra?: React.ReactNode;
  grid?: ListGridType;
  id?: string;
  itemLayout?: ListItemLayout;
  loading?: boolean | SpinProps;
  loadMore?: React.ReactNode;
  pagination?: PaginationConfig | false;
  prefixCls?: string;
  rowKey?: ((item: T) => React.Key) | keyof T;
  renderItem?: (item: T, index: number) => React.ReactNode;
  size?: ListSize;
  split?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  locale?: ListLocale;
}

export interface ListLocale {
  emptyText: React.ReactNode;
}

function List<T>({
  pagination = false as ListProps<any>['pagination'],
  prefixCls: customizePrefixCls,
  bordered = false,
  split = true,
  className,
  rootClassName,
  style,
  children,
  itemLayout,
  loadMore,
  grid,
  dataSource = [],
  size,
  header,
  footer,
  loading = false,
  rowKey,
  renderItem,
  locale,
  ...rest
}: ListProps<T>) {
  const paginationObj = pagination && typeof pagination === 'object' ? pagination : {};

  const [paginationCurrent, setPaginationCurrent] = React.useState(
    paginationObj.defaultCurrent || 1,
  );
  const [paginationSize, setPaginationSize] = React.useState(paginationObj.defaultPageSize || 10);

  const { getPrefixCls, renderEmpty, direction, list } = React.useContext(ConfigContext);

  const defaultPaginationProps = {
    current: 1,
    total: 0,
  };

  const triggerPaginationEvent = (eventName: string) => (page: number, pageSize: number) => {
    setPaginationCurrent(page);
    setPaginationSize(pageSize);
    if (pagination && (pagination as any)[eventName]) {
      (pagination as any)[eventName](page, pageSize);
    }
  };

  const onPaginationChange = triggerPaginationEvent('onChange');

  const onPaginationShowSizeChange = triggerPaginationEvent('onShowSizeChange');

  const renderInnerItem = (item: T, index: number) => {
    if (!renderItem) return null;

    let key;

    if (typeof rowKey === 'function') {
      key = rowKey(item);
    } else if (rowKey) {
      key = item[rowKey];
    } else {
      key = (item as any).key;
    }

    if (!key) {
      key = `list-item-${index}`;
    }

    return <React.Fragment key={key}>{renderItem(item, index)}</React.Fragment>;
  };

  const isSomethingAfterLastItem = () => !!(loadMore || pagination || footer);

  const prefixCls = getPrefixCls('list', customizePrefixCls);

  // Style
  const [wrapSSR, hashId] = useStyle(prefixCls);

  let loadingProp = loading;
  if (typeof loadingProp === 'boolean') {
    loadingProp = {
      spinning: loadingProp,
    };
  }
  const isLoading = loadingProp && loadingProp.spinning;

  // large => lg
  // small => sm
  let sizeCls = '';
  switch (size) {
    case 'large':
      sizeCls = 'lg';
      break;
    case 'small':
      sizeCls = 'sm';
      break;
    default:
      break;
  }

  const classString = classNames(
    prefixCls,
    {
      [`${prefixCls}-vertical`]: itemLayout === 'vertical',
      [`${prefixCls}-${sizeCls}`]: sizeCls,
      [`${prefixCls}-split`]: split,
      [`${prefixCls}-bordered`]: bordered,
      [`${prefixCls}-loading`]: isLoading,
      [`${prefixCls}-grid`]: !!grid,
      [`${prefixCls}-something-after-last-item`]: isSomethingAfterLastItem(),
      [`${prefixCls}-rtl`]: direction === 'rtl',
    },
    list?.className,
    className,
    rootClassName,
    hashId,
  );

  const paginationProps = extendsObject<PaginationConfig>(
    defaultPaginationProps,
    {
      total: dataSource.length,
      current: paginationCurrent,
      pageSize: paginationSize,
    },
    pagination || {},
  );

  const largestPage = Math.ceil(paginationProps.total / paginationProps.pageSize);
  if (paginationProps.current > largestPage) {
    paginationProps.current = largestPage;
  }
  const paginationContent = pagination ? (
    <div
      className={classNames(
        `${prefixCls}-pagination`,
        `${prefixCls}-pagination-align-${paginationProps?.align ?? 'end'}`,
      )}
    >
      <Pagination
        {...paginationProps}
        onChange={onPaginationChange}
        onShowSizeChange={onPaginationShowSizeChange}
      />
    </div>
  ) : null;

  let splitDataSource = [...dataSource];
  if (pagination) {
    if (dataSource.length > (paginationProps.current - 1) * paginationProps.pageSize) {
      splitDataSource = [...dataSource].splice(
        (paginationProps.current - 1) * paginationProps.pageSize,
        paginationProps.pageSize,
      );
    }
  }

  const needResponsive = Object.keys(grid || {}).some((key) =>
    ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'].includes(key),
  );
  const screens = useBreakpoint(needResponsive);
  const currentBreakpoint = React.useMemo(() => {
    for (let i = 0; i < responsiveArray.length; i += 1) {
      const breakpoint: Breakpoint = responsiveArray[i];
      if (screens[breakpoint]) {
        return breakpoint;
      }
    }
    return undefined;
  }, [screens]);

  const colStyle = React.useMemo(() => {
    if (!grid) {
      return undefined;
    }
    const columnCount =
      currentBreakpoint && grid[currentBreakpoint] ? grid[currentBreakpoint] : grid.column;
    if (columnCount) {
      return {
        width: `${100 / columnCount}%`,
        maxWidth: `${100 / columnCount}%`,
      };
    }
  }, [grid?.column, currentBreakpoint]);

  let childrenContent: React.ReactNode = isLoading && <div style={{ minHeight: 53 }} />;
  if (splitDataSource.length > 0) {
    const items = splitDataSource.map((item: T, index: number) => renderInnerItem(item, index));
    childrenContent = grid ? (
      <Row gutter={grid.gutter}>
        {React.Children.map(items, (child) => (
          <div key={child?.key} style={colStyle}>
            {child}
          </div>
        ))}
      </Row>
    ) : (
      <ul className={`${prefixCls}-items`}>{items}</ul>
    );
  } else if (!children && !isLoading) {
    childrenContent = (
      <div className={`${prefixCls}-empty-text`}>
        {(locale && locale.emptyText) || renderEmpty?.('List') || (
          <DefaultRenderEmpty componentName="List" />
        )}
      </div>
    );
  }

  const paginationPosition = paginationProps.position || 'bottom';
  const contextValue = React.useMemo(
    () => ({ grid, itemLayout }),
    [JSON.stringify(grid), itemLayout],
  );

  return wrapSSR(
    <ListContext.Provider value={contextValue}>
      <div style={{ ...list?.style, ...style }} className={classString} {...rest}>
        {(paginationPosition === 'top' || paginationPosition === 'both') && paginationContent}
        {header && <div className={`${prefixCls}-header`}>{header}</div>}
        <Spin {...loadingProp}>
          {childrenContent}
          {children}
        </Spin>
        {footer && <div className={`${prefixCls}-footer`}>{footer}</div>}
        {loadMore ||
          ((paginationPosition === 'bottom' || paginationPosition === 'both') && paginationContent)}
      </div>
    </ListContext.Provider>,
  );
}

if (process.env.NODE_ENV !== 'production') {
  List.displayName = 'List';
}

List.Item = Item;

export default List;
