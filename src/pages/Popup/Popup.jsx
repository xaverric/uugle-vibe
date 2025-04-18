import React, { useState, useEffect, useRef, useMemo } from "react";
import Search from "@material-ui/icons/Search";
import SettingsIcon from '@material-ui/icons/Settings';
import ClearIcon from '@material-ui/icons/Clear';
import { FixedSizeList } from 'react-window';
import { 
  List, 
  InputAdornment, 
  TextField, 
  Button, 
  Box, 
  CssBaseline, 
  Chip,
  Paper,
  Typography,
  Popper,
  ClickAwayListener,
  CircularProgress,
  IconButton
} from "@material-ui/core";
import { makeStyles, createMuiTheme, ThemeProvider } from "@material-ui/core/styles";
import { blue } from '@material-ui/core/colors';
import PageListItem from "./PageListItem";
import { Star, StarBorder } from "@material-ui/icons";

// Create a theme with blue as the primary color and proper dark theme support
const createAppTheme = (mode) => createMuiTheme({
  palette: {
    primary: blue,
    type: mode, // 'light' or 'dark'
    background: {
      default: mode === 'dark' ? '#303030' : '#fafafa',
      paper: mode === 'dark' ? '#424242' : '#fff',
    },
    text: {
      primary: mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
      secondary: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
    },
  },
});

const useStyles = makeStyles(theme => ({
  textField: {
    width: "calc(100% - 50px)", // Leave space for settings button
    marginBottom: theme.spacing(1),
    "& .MuiOutlinedInput-root": {
      borderRadius: 6,
    }
  },
  settingsButton: {
    minWidth: '40px',
    width: '40px',
    height: '40px',
    padding: 8,
    marginLeft: theme.spacing(1),
    marginBottom: theme.spacing(1),
    borderRadius: 6,
    position: 'absolute',
    right: theme.spacing(2),
    top: theme.spacing(2),
  },
  settingsIcon: {
    fontSize: '1.5rem',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'flex-start', // Align to top to match the search field
    width: '100%', // Full width to align with container
    borderRadius: 6, // Add rounded corners
  },
  list: {
    overflowY: "auto",
    maxHeight: "500px",
    borderRadius: 6, // Add rounded corners
  },
  listIconItem: {
    marginLeft: "4px",
    minWidth: "26px",
  },
  pageIcon: {
    color: theme.palette.grey.A700,
    fontSize: "1.2rem",
  },
  container: {
    padding: theme.spacing(2),
    borderRadius: 8,
    overflow: 'hidden',
  },
  chip: {
    margin: theme.spacing(0.5),
    backgroundColor: blue[600],
    color: 'white',
    fontWeight: 'bold',
  },
  bookDropdown: {
    position: 'absolute',
    zIndex: 1000,
    width: 'calc(100% - 50px)',
    maxHeight: '300px',
    overflowY: 'auto',
    marginTop: '5px',
    padding: theme.spacing(1),
    border: `2px solid ${blue[500]}`,
    borderRadius: '4px',
  },
  bookOption: {
    padding: theme.spacing(1),
    cursor: 'pointer',
    borderRadius: '4px',
    margin: '4px 0',
    '&:hover': {
      backgroundColor: theme.palette.type === 'dark' ? blue[800] : blue[100],
    },
  },
  bookHighlight: {
    color: blue[600],
    fontWeight: 'bold',
  },
  activeFilters: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  loadingIndicator: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2),
  },
  searchProgress: {
    color: blue[500],
    position: 'absolute',
    right: '60px',
    top: '14px',
    zIndex: 1,
  },
  noResults: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  }
}));

// Create a virtualized row renderer
const Row = React.memo(({ data, index, style }) => {
  const { pages, selectedIndex, onLinkClick, themeMode } = data;
  const page = pages[index];
  
  return (
    <div style={style}>
      <PageListItem
        page={page}
        selected={index === selectedIndex}
        onLinkClick={onLinkClick}
        themeMode={themeMode}
      />
    </div>
  );
});

// Create a virtualized row renderer for book dropdown
const BookRow = React.memo(({ data, index, style }) => {
  const { books, highlightedIndex, onSelectBook, themeMode, highlightedRef, onToggleFavorite, favoriteBooks } = data;
  const book = books[index];
  const isHighlighted = index === highlightedIndex;
  const isFavorite = favoriteBooks.has(book.awid);
  
  return (
    <Box 
      ref={isHighlighted ? highlightedRef : null}
      style={{
        ...style,
        backgroundColor: isHighlighted ? (themeMode === 'dark' ? '#424242' : '#e3f2fd') : 'transparent',
        border: isHighlighted ? `1px solid ${blue[400]}` : 'none',
        borderRadius: '4px',
        margin: '4px',
        padding: '8px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Typography 
        variant="body1" 
        onClick={() => onSelectBook(book)}
        style={{ flex: 1 }}
      >
        {book.name}
      </Typography>
      <IconButton
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(book);
        }}
        style={{ 
          color: isFavorite ? '#FFD700' : (themeMode === 'dark' ? '#666' : '#999'),
          padding: 4
        }}
      >
        {isFavorite ? <Star /> : <StarBorder />}
      </IconButton>
    </Box>
  );
});

function Popup() {
  const [themeMode, setThemeMode] = useState('light');
  const classes = useStyles();
  const [searchResults, setSearchResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [favoriteBooks, setFavoriteBooks] = useState(new Set());
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [highlightedBookIndex, setHighlightedBookIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 50; // Number of results per page
  const searchInputRef = useRef(null);
  const anchorRef = useRef(null);
  const bookDropdownRef = useRef(null);
  const highlightedBookRef = useRef(null);
  const searchTimerRef = useRef(null);

  // Load saved theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  // Load favorite books from storage
  useEffect(() => {
    chrome.storage.sync.get(['favoriteBooks'], (result) => {
      if (result.favoriteBooks) {
        setFavoriteBooks(new Set(result.favoriteBooks));
      }
    });
  }, []);

  // Save favorites when they change
  useEffect(() => {
    if (favoriteBooks.size > 0) {
      chrome.storage.sync.set({
        favoriteBooks: Array.from(favoriteBooks)
      });
    }
  }, [favoriteBooks]);

  // Fetch available books when component mounts
  useEffect(() => {
    const loadBooks = async (retryCount = 0) => {
      setIsBooksLoading(true);
      
      try {
        const response = await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Books request timed out'));
          }, 5000); // 5 second timeout

          chrome.runtime.sendMessage(
            { messageType: "getBooksRequest" },
            response => {
              clearTimeout(timeoutId);
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
              } else {
                resolve(response);
              }
            }
          );
        });

        if (response && response.books && response.books.length > 0) {
          setBooks(response.books);
          setFilteredBooks(response.books);
        } else {
          await fetchBooksFromSearchResults();
        }
      } catch (error) {
        console.error("uugle-vibe: Error fetching books:", error);
        
        // Retry logic - try up to 3 times with increasing delays
        if (retryCount < 2) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s delays
          setTimeout(() => loadBooks(retryCount + 1), delay);
          return;
        }
        
        // If all retries failed, try the fallback
        await fetchBooksFromSearchResults();
      } finally {
        setIsBooksLoading(false);
      }
    };

    loadBooks();

    // Cleanup function to handle component unmount
    return () => {
      setIsBooksLoading(false);
    };
  }, []);

  // Extract books from search results as a fallback
  const fetchBooksFromSearchResults = async (retryCount = 0) => {
    try {
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Search request timed out'));
        }, 5000); // 5 second timeout

        chrome.runtime.sendMessage(
          { 
            messageType: "searchRequest", 
            data: { 
              query: "book",
              bookId: null
            } 
          },
          response => {
            clearTimeout(timeoutId);
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          }
        );
      });

      if (response && response.results && response.results.length > 0) {
        const booksFromResults = [];
        const bookMap = new Map();
        
        response.results.forEach(page => {
          if (page.bookName && page.awid && !bookMap.has(page.awid)) {
            bookMap.set(page.awid, true);
            booksFromResults.push({
              awid: page.awid,
              name: page.bookName
            });
          }
        });
        
        if (booksFromResults.length > 0) {
          setBooks(booksFromResults);
          setFilteredBooks(booksFromResults);
        }
      }
    } catch (error) {
      console.error("uugle-vibe: Error in fallback book loading:", error);
      
      // Retry logic for fallback
      if (retryCount < 2) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchBooksFromSearchResults(retryCount + 1), delay);
      }
    }
  };

  // Check if input contains ":book" command and show dropdown accordingly
  useEffect(() => {
    // Simple detection of the ":book" command being typed
    if (searchQuery.toLowerCase().includes(':book') && !showBookDropdown && !selectedBook) {
      setShowBookDropdown(true);
      setHighlightedBookIndex(0); // Reset highlighted index when opening dropdown
      
      // If there's text after :book, use it to filter the books
      const match = searchQuery.toLowerCase().match(/:book\s+(.*?)(\s|$)/);
      if (match && match[1]) {
        const bookSearch = match[1].trim();
        setBookSearchTerm(bookSearch);
        setFilteredBooks(
          books.filter(book => 
            book.name.toLowerCase().includes(bookSearch.toLowerCase())
          )
        );
      } else {
        setBookSearchTerm('');
        setFilteredBooks(books);
      }
    } else if (!searchQuery.toLowerCase().includes(':book')) {
      // Close dropdown if :book is removed from query
      setShowBookDropdown(false);
    }
  }, [searchQuery, books, selectedBook]);

  // Scroll highlighted book into view
  useEffect(() => {
    if (showBookDropdown && highlightedBookRef.current) {
      highlightedBookRef.current.scrollIntoView({
        behavior: 'smooth', // Optional: smooth scrolling
        block: 'nearest',
      });
    }
  }, [highlightedBookIndex, showBookDropdown]);

  function handleSearchResponse(response) {
    setSearchResults(response.results || []);
    setHasMoreResults(response.hasMore || false);
    setTotalPages(response.totalPages || 1);
    setSelectedIndex(0);
    setIsLoading(false);
  }

  function loadNextPage() {
    if (isLoading || !hasMoreResults) return;
    
    setIsLoading(true);
    setCurrentPage(prevPage => prevPage + 1);
    
    // If we have a selected book, extract actual search query without the book label
    let actualQuery = searchQuery;
    let bookId = null;
    
    if (selectedBook) {
      // Use a more reliable regex to extract just the search part
      const bookPattern = new RegExp(`:book\\s+"${selectedBook.name}"`, 'i');
      actualQuery = searchQuery.replace(bookPattern, '').trim();
      bookId = selectedBook.awid;
    }
    
    chrome.runtime.sendMessage(
      { 
        messageType: "searchRequest", 
        data: { 
          query: actualQuery,
          bookId: bookId,
          page: currentPage + 1,
          pageSize: pageSize
        } 
      },
      response => {
        if (response && response.results) {
          // Append new results to existing results
          setSearchResults(prev => [...prev, ...(response.results || [])]);
          setHasMoreResults(response.hasMore || false);
          setTotalPages(response.totalPages || 1);
        }
        setIsLoading(false);
      }
    );
  }

  async function handleSearchFieldChange(event) {
    const query = event.target.value;
    setSearchQuery(query);
    
    // Reset pagination when search changes
    setCurrentPage(0);

    // Clear any existing timeout to prevent multiple searches
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Set loading state immediately for better UX
    setIsLoading(true);

    // Debounce the search - only execute after 300ms of no typing
    searchTimerRef.current = setTimeout(() => {
      // If we have a selected book, extract actual search query without the book label
      let actualQuery = query;
      let bookId = null;
      
      if (selectedBook) {
        // Use a more reliable regex to extract just the search part
        const bookPattern = new RegExp(`:book\\s+"${selectedBook.name}"`, 'i');
        actualQuery = query.replace(bookPattern, '').trim();
        bookId = selectedBook.awid;
      }
      
      chrome.runtime.sendMessage(
        { 
          messageType: "searchRequest", 
          data: { 
            query: actualQuery,
            bookId: bookId,
            page: 0,
            pageSize: pageSize
          } 
        },
        handleSearchResponse
      );
    }, 300); // 300ms debounce time
  }

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (searchTimerRef.current) {
        clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  function selectBook(book) {
    setSelectedBook(book);
    setShowBookDropdown(false);
    
    // Clear the search query after selecting a book
    setSearchQuery('');
    
    // Update search results with the filter (query should be empty now)
    chrome.runtime.sendMessage(
      { 
        messageType: "searchRequest", 
        data: { 
          query: '', // Send empty query to show all pages for the book
          bookId: book.awid
        } 
      },
      handleSearchResponse
    );

    // Set focus back to search input (which is now empty)
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }

  function removeBookFilter() {
    // Remove the entire :book section from the query
    const newQuery = searchQuery.replace(/:book\s+"[^"]*"\s*/i, '').trim();
    setSearchQuery(newQuery);
    setSelectedBook(null);
    
    // Run search without book filter
    chrome.runtime.sendMessage(
      { 
        messageType: "searchRequest", 
        data: { 
          query: newQuery,
          bookId: null
        } 
      },
      handleSearchResponse
    );

    // Set focus back to search input
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }

  function handleKeyDown(event) {
    if (showBookDropdown && filteredBooks.length > 0) {
      // Prevent default browser behavior for arrows/enter/escape when dropdown is open
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) {
          event.preventDefault();
      }

      if (event.key === "Escape") {
        setShowBookDropdown(false);
        return;
      }
      else if (event.key === "ArrowDown") {
        setHighlightedBookIndex(current => 
          current < filteredBooks.length - 1 ? current + 1 : current
        );
        return;
      }
      else if (event.key === "ArrowUp") {
        setHighlightedBookIndex(current => 
          current > 0 ? current - 1 : 0
        );
        return;
      }
      else if (event.key === "Enter") {
        selectBook(filteredBooks[highlightedBookIndex]);
        return;
      }
      // Don't process other keys for search result navigation when dropdown is open
      return; 
    }

    // Regular search results navigation (only if dropdown is not open)
    if (event.key === "ArrowDown") {
      setSelectedIndex(currentSelectedIndex => {
        const newIndex = currentSelectedIndex + 1;
        return newIndex < searchResults.length
          ? newIndex
          : currentSelectedIndex;
      });
    } else if (event.key === "ArrowUp") {
      setSelectedIndex(currentSelectedIndex => {
        const newIndex = currentSelectedIndex - 1;
        return newIndex >= 0 ? newIndex : currentSelectedIndex;
      });
    } else if (event.key === "Enter") {
      if (searchResults[selectedIndex] !== undefined) {
        const selectedPage = searchResults[selectedIndex];
        openUrl(selectedPage.url, event.ctrlKey);
      }
    }
  }

  function handleLinkClick(url, newTab) {
    openUrl(url, newTab);
  }

  function openUrl(url, newTab) {
    //we do not use standard href with page url to be able to open multiple links on background tabs and to search popup remain open
    if (newTab) {
      chrome.tabs.create({ url, active: false });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const tab = tabs[0];
        chrome.tabs.update(tab.id, { url });
      });
    }
  }

  function openPluginManagementPage() {
    chrome.tabs.create({ url: "pluginManagement.html" });
  }

  const toggleFavorite = (book) => {
    setFavoriteBooks(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(book.awid)) {
        newFavorites.delete(book.awid);
      } else {
        newFavorites.add(book.awid);
      }
      return newFavorites;
    });
  };

  // Sort books with favorites first
  const sortedBooks = useMemo(() => {
    return [...filteredBooks].sort((a, b) => {
      const aIsFavorite = favoriteBooks.has(a.awid);
      const bIsFavorite = favoriteBooks.has(b.awid);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredBooks, favoriteBooks]);

  return (
    <ThemeProvider theme={createAppTheme(themeMode)}>
      <CssBaseline />
      <Box 
        className={classes.container} 
        style={{ 
          backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa',
          color: themeMode === 'dark' ? '#fff' : 'inherit',
          borderRadius: 8,
        }}
      >
        <Box className={classes.searchContainer} ref={anchorRef}>
          <TextField
            label="Search"
            variant="outlined"
            autoFocus={true}
            size={"small"}
            className={classes.textField}
            onChange={handleSearchFieldChange}
            onKeyDown={handleKeyDown}
            value={searchQuery}
            inputRef={searchInputRef}
            placeholder="Type :book to filter by book"
            helperText={showBookDropdown ? "Select a book to filter results" : null}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search style={{ color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined }}/>
                </InputAdornment>
              ),
              style: { 
                backgroundColor: themeMode === 'dark' ? '#424242' : '#fff',
                color: themeMode === 'dark' ? '#fff' : 'inherit'
              }
            }}
            InputLabelProps={{
              style: {
                color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined
              }
            }}
          />
          {isLoading && <CircularProgress size={24} className={classes.searchProgress} />}
          <Button 
            variant="outlined" 
            className={classes.settingsButton} 
            onClick={openPluginManagementPage}
            style={{
              borderColor: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : undefined,
              color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : undefined 
            }}
          >
            <SettingsIcon className={classes.settingsIcon} />
          </Button>
          
          {/* Book filter dropdown */}
          <Popper 
            open={showBookDropdown} 
            anchorEl={anchorRef.current}
            placement="bottom-start"
            modifiers={{
              offset: {
                enabled: true,
                offset: '0, 5'
              }
            }}
            style={{ zIndex: 1500, width: '100%' }}
          >
            <ClickAwayListener onClickAway={() => setShowBookDropdown(false)}>
              <Box px={2}>
                <Paper ref={bookDropdownRef} className={classes.bookDropdown} elevation={3}>
                  <Typography variant="subtitle2" gutterBottom style={{ padding: '8px 8px 0 8px' }}>
                    <strong>Select a book to filter results:</strong>
                  </Typography>
                  {isBooksLoading ? (
                    <Box display="flex" justifyContent="center" p={2}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : filteredBooks.length === 0 ? (
                    <Typography variant="body2" style={{ padding: '8px' }}>
                      {books.length === 0 ? 
                        "No books found. Visit a book page to index it." : 
                        "No matching books found"}
                    </Typography>
                  ) : (
                    <FixedSizeList
                      height={Math.min(300, sortedBooks.length * 50)}
                      width="100%"
                      itemCount={sortedBooks.length}
                      itemSize={50}
                      itemData={{
                        books: sortedBooks,
                        highlightedIndex: highlightedBookIndex,
                        onSelectBook: selectBook,
                        onToggleFavorite: toggleFavorite,
                        favoriteBooks: favoriteBooks,
                        themeMode,
                        highlightedRef: highlightedBookRef
                      }}
                    >
                      {BookRow}
                    </FixedSizeList>
                  )}
                </Paper>
              </Box>
            </ClickAwayListener>
          </Popper>
        </Box>
        
        {/* Active filters area */}
        {selectedBook && (
          <Box className={classes.activeFilters}>
            <Chip
              label={`Book: ${selectedBook.name}`}
              onDelete={removeBookFilter}
              className={classes.chip}
              deleteIcon={<ClearIcon style={{ color: 'white' }} />}
              style={{ maxWidth: '90%' }}
              title={selectedBook.name}
            />
          </Box>
        )}
        
        <List component="nav" dense={true} classes={{ root: classes.list }}>
          {isLoading && searchResults.length === 0 ? (
            <Box className={classes.loadingIndicator}>
              <CircularProgress size={40} />
            </Box>
          ) : searchResults.length === 0 ? (
            <Box className={classes.noResults}>
              <Typography variant="body2">No results found</Typography>
            </Box>
          ) : (
            <>
              <FixedSizeList
                height={Math.min(500, searchResults.length * 60)} // Adjust height based on results
                width="100%"
                itemCount={searchResults.length}
                itemSize={60} // Adjust based on your item height
                itemData={{
                  pages: searchResults,
                  selectedIndex,
                  onLinkClick: handleLinkClick,
                  themeMode
                }}
              >
                {Row}
              </FixedSizeList>
              
              {hasMoreResults && (
                <Box display="flex" justifyContent="center" p={1}>
                  <Button
                    variant="outlined"
                    color="primary"
                    disabled={isLoading}
                    onClick={loadNextPage}
                    style={{ marginTop: '8px' }}
                  >
                    {isLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      `Load More (${searchResults.length}/${totalPages * pageSize})`
                    )}
                  </Button>
                </Box>
              )}
            </>
          )}
        </List>
      </Box>
    </ThemeProvider>
  );
}

export default Popup;
