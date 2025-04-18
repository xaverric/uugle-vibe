import { Link, ListItem, ListItemText, Typography } from "@material-ui/core";
import React, { useLayoutEffect, useRef } from "react";
import { makeStyles } from "@material-ui/core/styles";
import PageState from "./PageState";
import KeyboardArrowRightIcon from "@material-ui/icons/ArrowRight";

const useStyles = makeStyles(theme => ({
  listItem: {
    paddingLeft: "8px",
    backgroundColor: props => props.themeMode === 'dark' ? '#303030' : 'inherit',
    '&.Mui-selected': {
      backgroundColor: props => props.themeMode === 'dark' ? 'rgba(144, 202, 249, 0.16)' : 'rgba(3, 169, 244, 0.08)',
      '&:hover': {
        backgroundColor: props => props.themeMode === 'dark' ? 'rgba(144, 202, 249, 0.24)' : 'rgba(3, 169, 244, 0.12)',
      },
    },
    '&:hover': {
      backgroundColor: props => props.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    },
    borderRadius: 4,
  },
  pageLink: ({ color, themeMode }) => ({
    fontWeight: "500",
    color: themeMode === 'dark' ? '#90caf9' : color || theme.palette.primary.main,
  }),
  breadcrumbLink: ({ color, themeMode }) => ({
    color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : color || 'rgba(0, 0, 0, 0.54)',
  }),
  breadcrumbSection: {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "inline-block",
    maxWidth: "600px",
    color: props => props.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
  },
}));

// Create a function to check if props changed meaningfully for memoization
function areEqual(prevProps, nextProps) {
  return (
    prevProps.page.id === nextProps.page.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.themeMode === nextProps.themeMode
  );
}

// Using React.memo with custom comparison function for optimized rendering
const PageListItem = React.memo(function PageListItem({ page, selected, onLinkClick, themeMode = 'light' }) {
  const classes = useStyles({ color: page.color, themeMode });
  const selectedLisItemRef = useRef();

  useLayoutEffect(() => {
    if (
      selected &&
      selectedLisItemRef.current &&
      !isElementInViewport(selectedLisItemRef.current)
    ) {
      selectedLisItemRef.current.scrollIntoView(false);
    }
  }, [selected]);

  function handleLinkClick(event, url) {
    onLinkClick(url, event.ctrlKey);
    event.preventDefault();
    event.stopPropagation();
  }

  function showBreadCrumbs() {
    return page.breadcrumbs && page.breadcrumbs.length > 0;
  }

  function showHomeLink() {
    return page.bookName && page.bookUrl && showBreadCrumbs();
  }

  const isDarkSelected = selected && themeMode === 'dark';

  return (
    <ListItem
      button
      disableGutters
      selected={selected}
      ref={selected ? selectedLisItemRef : null}
      alignItems={"flex-start"}
      onClick={event => handleLinkClick(event, page.url)}
      style={{
        paddingLeft: "16px",
        paddingRight: "16px",
        marginBottom: "2px",
      }}
      className={classes.listItem}
    >
      <ListItemText
        primary={
          <>
            <Link
              title={page.url}
              href={page.url}
              className={classes.pageLink}
              onClick={event => handleLinkClick(event, page.url)}
              style={{ color: isDarkSelected ? '#fff' : undefined }}
            >
              {page.bookName && `${page.bookName} - `}
              {page.name}
            </Link>
            <PageState state={page.state} />
          </>
        }
        secondary={
          <Typography 
            variant={"caption"} 
            className={classes.breadcrumbSection} 
            style={{ color: isDarkSelected ? 'rgba(255, 255, 255, 0.87)' : undefined }}
          >
            {showHomeLink() && (
              <Link
                title={page.bookUrl}
                href={page.bookUrl}
                onClick={event => handleLinkClick(event, page.bookUrl)}
                className={classes.breadcrumbLink}
                style={{ color: isDarkSelected ? 'rgba(255, 255, 255, 0.87)' : undefined }}
              >
                Home
              </Link>
            )}
            {showBreadCrumbs() &&
              page.breadcrumbs.map(breadcrumb => {
                const breadcrumbUrl = getBreadcrumbUrl(
                  page.bookUrl,
                  breadcrumb.code
                );
                return (
                  <React.Fragment key={breadcrumb.code}>
                    <KeyboardArrowRightIcon
                      style={{
                        verticalAlign: "text-bottom",
                        fontSize: "16px",
                        color: isDarkSelected ? 'rgba(255, 255, 255, 0.87)' : 'inherit'
                      }}
                    />
                    <Link
                      key={breadcrumb.code}
                      title={breadcrumbUrl}
                      href={breadcrumbUrl}
                      onClick={event => handleLinkClick(event, breadcrumbUrl)}
                      className={classes.breadcrumbLink}
                      style={{ color: isDarkSelected ? 'rgba(255, 255, 255, 0.87)' : undefined }}
                    >
                      {breadcrumb.name}
                    </Link>
                  </React.Fragment>
                );
              })}
          </Typography>
        }
      />
    </ListItem>
  );
}, areEqual);

export default PageListItem;

function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

function getBreadcrumbUrl(bookUrl, code) {
  return `${bookUrl}/book/page?code=${code}`;
}
