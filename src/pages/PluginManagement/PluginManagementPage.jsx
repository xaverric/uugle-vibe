import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Paper,
  Typography,
  Link,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Snackbar,
  CircularProgress,
  Switch,
  CssBaseline,
} from '@material-ui/core';
import { makeStyles, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import { blue, red } from '@material-ui/core/colors';
import DeleteIcon from '@material-ui/icons/Delete';
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import CloudDownloadIcon from '@material-ui/icons/CloudDownload';
import MenuBookIcon from '@material-ui/icons/MenuBook';
import PageIcon from '@material-ui/icons/Description';
import { openDb, requestToPromise, booksScheme, pagesScheme, indexScheme, indexObjectId } from '../../common'; // Import DB functions and schemes

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
  overrides: {
    MuiCssBaseline: {
      '@global': {
        body: {
          backgroundColor: mode === 'dark' ? '#303030' : '#fafafa',
          color: mode === 'dark' ? '#fff' : '#000',
        },
        '::selection': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.16)',
        },
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiPaper: {
      root: {
        backgroundColor: mode === 'dark' ? '#424242' : '#fff',
        width: '100%',
      },
    },
    MuiDialog: {
      paper: {
        backgroundColor: mode === 'dark' ? '#424242' : '#fff',
      },
    },
    MuiTable: {
      root: {
        backgroundColor: mode === 'dark' ? '#303030' : '#fff',
      },
    },
    MuiTableContainer: {
      root: {
        backgroundColor: mode === 'dark' ? '#303030' : '#fff',
      },
    },
    MuiTableBody: {
      root: {
        backgroundColor: mode === 'dark' ? '#303030' : '#fff',
      },
    },
    MuiTableHead: {
      root: {
        backgroundColor: mode === 'dark' ? '#303030' : '#f5f5f5',
      },
    },
    MuiTableRow: {
      root: {
        backgroundColor: mode === 'dark' ? '#303030' : '#fff',
        '&:hover': {
          backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
      },
      head: {
        backgroundColor: mode === 'dark' ? '#303030' : '#f5f5f5',
      },
    },
    MuiTableCell: {
      root: {
        borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(224, 224, 224, 1)',
        color: mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
        backgroundColor: mode === 'dark' ? '#303030' : '#fff',
      },
      head: {
        backgroundColor: mode === 'dark' ? '#303030' : '#f5f5f5',
        color: mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
      },
      body: {
        backgroundColor: mode === 'dark' ? '#303030' : '#fff',
      },
    },
    MuiTableSortLabel: {
      root: {
        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
        '&:hover': {
          color: mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
        },
        '&.MuiTableSortLabel-active': {
          color: mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
        },
      },
      icon: {
        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
      },
    },
    MuiInputBase: {
      root: {
        color: mode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)',
      },
    },
    MuiTextField: {
      root: {
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)',
          },
          '&:hover fieldset': {
            borderColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
          },
          backgroundColor: mode === 'dark' ? '#424242' : '#fff',
        },
        '& .MuiInputLabel-outlined': {
          color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
        },
      },
    },
    MuiTab: {
      root: {
        '&.Mui-selected': {
          color: blue[mode === 'dark' ? 300 : 700],
        },
      },
    },
    MuiLink: {
      root: {
        color: blue[mode === 'dark' ? 300 : 700],
      },
    },
    MuiIconButton: {
      root: {
        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)',
      },
    },
    MuiButton: {
      textPrimary: {
        color: blue[mode === 'dark' ? 300 : 700],
      },
    },
    MuiDialogContentText: {
      root: {
        color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
      },
    },
  },
});

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    height: '100vh', // Full height
    width: '100%', // Full width
    backgroundColor: theme.palette.background.default,
    color: theme.palette.text.primary,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
    width: 150, // Reduced width for tabs to give more space to content
    flexShrink: 0,
    backgroundColor: theme.palette.background.paper,
    '& .MuiTab-root': {
      minWidth: 'unset',
      padding: '8px 12px',
    },
  },
  tabPanel: {
    flexGrow: 1,
    padding: theme.spacing(2),
    overflow: 'auto', // Allow scrolling for content
    width: 'calc(100% - 150px)', // Match the reduced tabs width
    boxSizing: 'border-box', // Ensure padding is included in width calculation
    backgroundColor: theme.palette.background.default,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
    width: '100%', // Full width
    maxHeight: 'calc(100vh - 180px)', // Adjust based on other elements
    backgroundColor: theme.palette.background.paper,
  },
  table: {
    minWidth: '100%', // Ensure table takes full width
    tableLayout: 'fixed', // Fixed layout for better column control
    backgroundColor: theme.palette.background.paper,
  },
  filterField: {
    margin: theme.spacing(0.5),
    minWidth: 150,
  },
  visuallyHidden: {
    border: 0,
    clip: 'rect(0 0 0 0)',
    height: 1,
    margin: -1,
    overflow: 'hidden',
    padding: 0,
    position: 'absolute',
    top: 20,
    width: 1,
  },
  headerCell: {
    fontWeight: 'bold',
    padding: '8px 16px', // More compact padding
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : '#f5f5f5',
    color: theme.palette.text.primary,
  },
  tableCell: {
    padding: '4px 16px', // More compact padding
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.background.paper : '#fff',
  },
  paper: {
    width: '100%',
    backgroundColor: theme.palette.background.paper,
  },
  filtersContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: theme.spacing(1),
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : '#f9f9f9',
  },
  nameColumn: {
    width: '25%',
  },
  urlColumn: {
    width: '40%',
    wordBreak: 'break-word',
  },
  typeColumn: {
    width: '15%',
  },
  bookNameColumn: {
    width: '15%',
  },
  awidColumn: {
    width: '15%',
    wordBreak: 'break-all', // Break long AWIDs
  },
  footer: {
    padding: theme.spacing(1),
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : '#f5f5f5',
    borderTop: `1px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
  },
  actionColumn: {
    width: '5%',
    textAlign: 'center',
  },
  deleteButton: {
    color: theme.palette.error.main,
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  buttonsContainer: {
    display: 'flex',
    gap: theme.spacing(1),
  },
  importInput: {
    display: 'none',
  },
  importExportButton: {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  subtabs: {
    borderBottom: `1px solid ${theme.palette.divider}`,
    marginBottom: theme.spacing(2),
  },
  subtabContent: {
    marginTop: theme.spacing(2),
  },
  dateColumn: {
    width: '20%',
  },
  awidColumn: {
    width: '40%',
    wordBreak: 'break-all',
  },
  tableRow: {
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : '#fff',
    '&:hover': {
      backgroundColor: theme.palette.type === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    },
    '& .MuiTableCell-root': {
      backgroundColor: 'inherit !important',
    }
  },
  tableBody: {
    backgroundColor: theme.palette.type === 'dark' ? theme.palette.grey[800] : '#fff',
  },
}));

// --- Data Fetching ---
async function fetchDataFromDb() {
  try {
    const db = await openDb();
    const transaction = db.transaction([booksScheme, pagesScheme], 'readonly');
    const bookStore = transaction.objectStore(booksScheme);
    const pageStore = transaction.objectStore(pagesScheme);

    const books = await requestToPromise(bookStore.getAll());
    const pages = await requestToPromise(pageStore.getAll());

    // Create lookup map for books by awid
    const bookMap = new Map(books.map(b => [b.awid, b]));

    // Process pages with improved URL and type detection logic
    const combinedData = pages.map(page => {
      const book = bookMap.get(page.awid);
      let type = 'bookkit'; // Default to bookkit if we can't determine otherwise
      let url = page.url || '#';
      
      // First determine the type based on URL if it exists
      if (page.url) {
        if (page.url.includes('uu-managementkit-main') || page.url.includes('uu-mngkit-main')) {
          type = 'mngkit';
          // For mngkit, always preserve the original URL
          url = page.url;
        } else if (page.url.includes('uu-bookkit-main') || page.url.includes('uu-bookkitg01-main')) {
          type = 'bookkit';
        } else if (page.url.includes('uu-dockit-main') || page.url.includes('uu-dockitg01-main')) {
          type = 'dockit';
        }
      }
      
      // For bookkit pages, ensure URL is properly composed if we have the necessary data
      if (type === 'bookkit' && page.awid && page.code) {
        url = `https://uuapp.plus4u.net/uu-bookkit-maing01/${page.awid}/book/page?code=${page.code}`;
      }
      
      return {
        id: page.id,
        name: page.name || 'N/A',
        url: url,
        type: type,
        bookName: book?.name || page.bookName || 'Unknown Book',
        awid: page.awid,  // Keep for reference but won't display
        code: page.code,
      };
    });
    
    return combinedData;
  } catch (error) {
    console.error("uugle-vibe: Error fetching data from IndexedDB:", error);
    return [];
  }
}

// New function to fetch only books data
async function fetchBooksFromDb() {
  try {
    const db = await openDb();
    const transaction = db.transaction([booksScheme, pagesScheme], 'readonly');
    const bookStore = transaction.objectStore(booksScheme);
    const pageStore = transaction.objectStore(pagesScheme);
    
    const books = await requestToPromise(bookStore.getAll());
    
    // For each book, count the number of pages
    const booksWithPageCount = await Promise.all(books.map(async book => {
      const index = pageStore.index("awid");
      const pages = await requestToPromise(index.getAll(book.awid));
      
      return {
        ...book,
        pageCount: pages.length,
        formattedDate: new Date(book.lastUpdate).toLocaleString()
      };
    }));
    
    return booksWithPageCount;
  } catch (error) {
    console.error("uugle-vibe: Error fetching books from IndexedDB:", error);
    return [];
  }
}

// --- Sorting Helpers ---
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function stableSort(array, comparator) {
  const stabilizedThis = array.map((el, index) => [el, index]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

// --- Table Header ---
const headCells = [
  { id: 'name', numeric: false, disablePadding: false, label: 'Name', className: 'nameColumn' },
  { id: 'url', numeric: false, disablePadding: false, label: 'URL', className: 'urlColumn' },
  { id: 'type', numeric: false, disablePadding: false, label: 'Type', className: 'typeColumn' },
  { id: 'bookName', numeric: false, disablePadding: false, label: 'Source Book', className: 'bookNameColumn' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions', className: 'actionColumn' },
];

function EnhancedTableHead(props) {
  const { classes, order, orderBy, onRequestSort, themeMode } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#f5f5f5' }}>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            className={`${classes.headerCell} ${classes[headCell.className]}`}
            style={{ 
              backgroundColor: themeMode === 'dark' ? '#303030' : '#f5f5f5',
              color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)'
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              style={{ 
                color: themeMode === 'dark' ? '#fff' : 'inherit'
              }}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

// Table header for books
const bookHeadCells = [
  { id: 'name', numeric: false, disablePadding: false, label: 'Book Name', className: 'nameColumn' },
  { id: 'awid', numeric: false, disablePadding: false, label: 'AWID', className: 'awidColumn' },
  { id: 'formattedDate', numeric: false, disablePadding: false, label: 'Last Update', className: 'dateColumn' },
  { id: 'pageCount', numeric: true, disablePadding: false, label: 'Pages', className: 'typeColumn' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions', className: 'actionColumn' },
];

// Enhanced table head for books (reuses the existing structure)
function BooksTableHead(props) {
  const { classes, order, orderBy, onRequestSort, themeMode } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#f5f5f5' }}>
        {bookHeadCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            className={`${classes.headerCell} ${classes[headCell.className]}`}
            style={{ 
              backgroundColor: themeMode === 'dark' ? '#303030' : '#f5f5f5',
              color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)'
            }}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
              style={{ 
                color: themeMode === 'dark' ? '#fff' : 'inherit'
              }}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <span className={classes.visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </span>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

// --- Main Component ---
const PluginManagementPage = () => {
  const classes = useStyles();
  const [tabIndex, setTabIndex] = useState(0);
  const [subTabIndex, setSubTabIndex] = useState(0); // New state for subtabs
  const [themeMode, setThemeMode] = useState('light'); // New state for theme mode
  const [data, setData] = useState([]);
  const [booksData, setBooksData] = useState([]); // New state for books data
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [bookOrder, setBookOrder] = useState('asc'); // New state for books ordering
  const [bookOrderBy, setBookOrderBy] = useState('name'); // New state for books ordering
  const [filters, setFilters] = useState({
    name: '',
    url: '',
    type: '',
    bookName: '',
  });
  const [bookFilters, setBookFilters] = useState({ // New state for books filtering
    name: '',
    awid: '',
    formattedDate: '',
    pageCount: '',
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [confirmDeleteBook, setConfirmDeleteBook] = useState(false); // New state for book deletion
  const [bookToDelete, setBookToDelete] = useState(null); // New state for book deletion
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  useEffect(() => {
    loadData();
    loadBooksData(); // Load books data on component mount
    // Load saved theme on component mount
    const savedTheme = localStorage.getItem('themeMode');
    if (savedTheme) {
      setThemeMode(savedTheme);
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const fetchedData = await fetchDataFromDb();
      setData(fetchedData);
    } catch (error) {
      console.error("uugle-vibe: Error fetching data from IndexedDB:", error);
      setSnackbarMessage("Error loading data: " + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // New function to load books data
  const loadBooksData = async () => {
    try {
      setLoading(true);
      const fetchedBooks = await fetchBooksFromDb();
      setBooksData(fetchedBooks);
    } catch (error) {
      console.error("uugle-vibe: Error fetching books from IndexedDB:", error);
      setSnackbarMessage("Error loading books: " + error.message);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  // New handler for subtab changes
  const handleSubTabChange = (event, newValue) => {
    setSubTabIndex(newValue);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // New handler for book table sorting
  const handleBookRequestSort = (event, property) => {
    const isAsc = bookOrderBy === property && bookOrder === 'asc';
    setBookOrder(isAsc ? 'desc' : 'asc');
    setBookOrderBy(property);
  };

  const handleFilterChange = useCallback((event, columnId) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [columnId]: event.target.value,
    }));
  }, []);

  // New handler for book filter changes
  const handleBookFilterChange = useCallback((event, columnId) => {
    setBookFilters(prevFilters => ({
      ...prevFilters,
      [columnId]: event.target.value,
    }));
  }, []);

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    
    try {
      await deleteRecord(recordToDelete);
      setSnackbarMessage(`Successfully deleted "${recordToDelete.name}"`);
      setSnackbarOpen(true);
      // Refresh data
      await loadData();
    } catch (error) {
      console.error("Error deleting record:", error);
      setSnackbarMessage(`Failed to delete: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setConfirmDelete(false);
      setRecordToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDelete(false);
    setRecordToDelete(null);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const deleteRecord = async (record) => {
    try {
      const db = await openDb();
      const transaction = db.transaction([pagesScheme, booksScheme], 'readwrite');
      const pageStore = transaction.objectStore(pagesScheme);
      const bookStore = transaction.objectStore(booksScheme);
      
      // Delete the page record
      await requestToPromise(pageStore.delete(record.id));
      
      // Check if this is the last page for this book
      const index = pageStore.index("awid");
      const remainingPages = await requestToPromise(index.getAll(record.awid));
      
      // If no pages left for this book, delete the book record too
      if (remainingPages.length === 0) {
        await requestToPromise(bookStore.delete(record.awid));
      }
      
      // Return a success indicator
      return true;
    } catch (error) {
      console.error("Error in deleteRecord:", error);
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(row => {
      return Object.keys(filters).every(key => {
        // Skip non-data keys like 'actions'
        if (key === 'actions') return true;
        
        const filterValue = filters[key]?.toLowerCase();
        const rowValue = row[key]?.toString().toLowerCase();
        return !filterValue || rowValue?.includes(filterValue);
      });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    return stableSort(filteredData, getComparator(order, orderBy));
  }, [filteredData, order, orderBy]);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const db = await openDb();
      const transaction = db.transaction([booksScheme, pagesScheme], 'readonly');
      const bookStore = transaction.objectStore(booksScheme);
      const pageStore = transaction.objectStore(pagesScheme);
      
      const books = await requestToPromise(bookStore.getAll());
      const pages = await requestToPromise(pageStore.getAll());
      
      // Create the export object
      const exportData = {
        books,
        pages,
        exportDate: new Date().toISOString(),
      };
      
      // Convert to JSON and create a blob
      const jsonData = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `uugle-database-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSnackbarMessage('Database exported successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Export error:', error);
      setSnackbarMessage(`Export failed: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setIsImporting(true);
      
      // Read the file
      const fileContent = await readFileAsText(file);
      const importData = JSON.parse(fileContent);
      
      if (!importData.books || !importData.pages) {
        throw new Error('Invalid import file format. Missing books or pages data.');
      }
      
      console.log(`Importing ${importData.books.length} books and ${importData.pages.length} pages`);
      
      // Process the import
      const importResult = await importDatabaseContent(importData);
      console.log('Import result:', importResult);
      
      // Force reload the search index in background script
      notifyBackgroundScriptOfIndexUpdate();
      
      // Refresh the data display
      await loadData();
      
      // Show success message including number of imported items
      setSnackbarMessage(`Import completed: Added ${importResult.booksAdded} books and ${importResult.pagesAdded} pages. Search index rebuilt.`);
      setSnackbarOpen(true);
      
      // If this was an import to an empty database, add extra instructions
      if (importResult.wasEmptyDatabase) {
        setTimeout(() => {
          setSnackbarMessage('For search to work in popup, you may need to reload the extension (go to chrome://extensions and click reload)');
          setSnackbarOpen(true);
        }, 6000);
      }
    } catch (error) {
      console.error('Import error:', error);
      setSnackbarMessage(`Import failed: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setIsImporting(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  };
  
  const importDatabaseContent = async (importData) => {
    const db = await openDb();
    const transaction = db.transaction([booksScheme, pagesScheme, indexScheme], 'readwrite');
    const bookStore = transaction.objectStore(booksScheme);
    const pageStore = transaction.objectStore(pagesScheme);
    const indexStore = transaction.objectStore(indexScheme);
    
    // Get existing books and pages for duplicate checking
    const existingBooks = await requestToPromise(bookStore.getAll());
    const existingPages = await requestToPromise(pageStore.getAll());
    
    // Check if this is an import to an empty database
    const wasEmptyDatabase = existingBooks.length === 0 && existingPages.length === 0;
    
    const existingBookAwids = new Set(existingBooks.map(book => book.awid));
    const existingPageCombos = new Set(
      existingPages.map(page => `${page.awid}-${page.code}-${page.name}`)
    );
    
    // Import books (skip duplicates)
    const booksToAdd = importData.books.filter(book => !existingBookAwids.has(book.awid));
    for (const book of booksToAdd) {
      // Preserve all book fields exactly as they are
      await requestToPromise(bookStore.put(book));
    }
    
    // Import pages (skip duplicates)
    const pagesToAdd = importData.pages.filter(page => {
      const combo = `${page.awid}-${page.code}-${page.name}`;
      return !existingPageCombos.has(combo);
    });
    
    const addedPages = [];
    for (const page of pagesToAdd) {
      // Create a complete clone of the page to preserve all fields
      const pageToAdd = { ...page };
      
      // Only remove ID to avoid conflicts - IndexedDB will assign a new one
      if (pageToAdd.id !== undefined) {
        delete pageToAdd.id;
      }
      
      console.log('Adding page with URL:', pageToAdd.url);
      const newId = await requestToPromise(pageStore.add(pageToAdd));
      addedPages.push({ ...pageToAdd, id: newId });
    }
    
    // Rebuild the search index to include the new pages
    await rebuildSearchIndex(db);
    
    return {
      booksAdded: booksToAdd.length,
      pagesAdded: pagesToAdd.length,
      wasEmptyDatabase
    };
  };

  // Function to rebuild the search index after import
  const rebuildSearchIndex = async (db) => {
    try {
      // First, dynamically import elasticlunr
      const elasticlunrModule = await import('elasticlunr');
      const elasticlunr = elasticlunrModule.default;
      
      // Create a new transaction for reading all pages and updating the index
      const transaction = db.transaction([pagesScheme, indexScheme], 'readwrite');
      const pageStore = transaction.objectStore(pagesScheme);
      const indexStore = transaction.objectStore(indexScheme);
      
      // Get all pages to rebuild the index
      const allPages = await requestToPromise(pageStore.getAll());
      
      console.log(`Rebuilding search index with ${allPages.length} pages`);
      
      // Create a new search index with identical configuration to the original
      let searchIndex = elasticlunr(function() {
        this.setRef('id');
        this.addField('name');
        this.addField('bookName');
        // Add optional content field if used for searching
        this.addField('content');
        this.saveDocument(false);
      });
      
      // Add each page to the search index
      allPages.forEach(page => {
        const indexDoc = {
          id: page.id,
          name: page.name || '',
          bookName: page.bookName || '',
          content: page.content || '',
        };
        searchIndex.addDoc(indexDoc);
      });
      
      // Store the updated index
      const indexObject = {
        id: indexObjectId,
        indexDump: JSON.stringify(searchIndex),
      };
      
      await requestToPromise(indexStore.put(indexObject));
      console.log('Search index rebuilt successfully with', allPages.length, 'pages');
      
      // Notify the background script that the index has been updated
      notifyBackgroundScriptOfIndexUpdate();
      
    } catch (error) {
      console.error('Error rebuilding search index:', error);
      throw new Error(`Failed to rebuild search index: ${error.message}`);
    }
  };

  // Function to notify the background script that the index has been updated
  const notifyBackgroundScriptOfIndexUpdate = () => {
    try {chrome.runtime.sendMessage(
        { messageType: 'searchIndexUpdated' },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error notifying background script:', chrome.runtime.lastError);
          } else {
            console.log('Background script notified of index update:', response);
          }
        }
      );
    } catch (error) {
      console.error('Error sending message to background script:', error);
    }
  };

  const handleDeleteAllClick = () => {
    setConfirmDeleteAll(true);
  };

  const handleConfirmDeleteAll = async () => {
    try {
      setLoading(true);
      await deleteAllRecords();
      setSnackbarMessage("All records deleted successfully");
      setSnackbarOpen(true);
      // Refresh data
      await loadData();
    } catch (error) {
      console.error("Error deleting all records:", error);
      setSnackbarMessage(`Failed to delete all records: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setConfirmDeleteAll(false);
      setLoading(false);
    }
  };

  const handleCancelDeleteAll = () => {
    setConfirmDeleteAll(false);
  };
  
  const deleteAllRecords = async () => {
    try {
      const db = await openDb();
      const transaction = db.transaction([pagesScheme, booksScheme, indexScheme], 'readwrite');
      const pageStore = transaction.objectStore(pagesScheme);
      const bookStore = transaction.objectStore(booksScheme);
      const indexStore = transaction.objectStore(indexScheme);
      
      // Delete all pages
      await requestToPromise(pageStore.clear());
      
      // Delete all books
      await requestToPromise(bookStore.clear());
      
      // Clear the search index but keep the structure
      // We'll create an empty index instead of deleting it completely
      const elasticlunrModule = await import('elasticlunr');
      const elasticlunr = elasticlunrModule.default;
      
      let emptyIndex = elasticlunr(function() {
        this.setRef('id');
        this.addField('name');
        this.addField('bookName');
        this.addField('content');
        this.saveDocument(false);
      });
      
      // Store the empty index
      const indexObject = {
        id: indexObjectId,
        indexDump: JSON.stringify(emptyIndex),
      };
      
      await requestToPromise(indexStore.put(indexObject));
      
      // Notify the background script about the index change
      notifyBackgroundScriptOfIndexUpdate();
      
      return true;
    } catch (error) {
      console.error("Error in deleteAllRecords:", error);
      throw new Error(`Failed to delete all records: ${error.message}`);
    }
  };

  // New handler for delete book click
  const handleDeleteBookClick = (book) => {
    setBookToDelete(book);
    setConfirmDeleteBook(true);
  };

  // New handler for confirm delete book
  const handleConfirmDeleteBook = async () => {
    if (!bookToDelete) return;
    
    try {
      await deleteBookAndRelatedPages(bookToDelete);
      setSnackbarMessage(`Successfully deleted "${bookToDelete.name}" and related pages`);
      setSnackbarOpen(true);
      // Refresh data
      await loadData();
      await loadBooksData();
    } catch (error) {
      console.error("Error deleting book:", error);
      setSnackbarMessage(`Failed to delete book: ${error.message}`);
      setSnackbarOpen(true);
    } finally {
      setConfirmDeleteBook(false);
      setBookToDelete(null);
    }
  };

  // New handler for cancel delete book
  const handleCancelDeleteBook = () => {
    setConfirmDeleteBook(false);
    setBookToDelete(null);
  };

  // New function to delete a book and all its related pages
  const deleteBookAndRelatedPages = async (book) => {
    try {
      const db = await openDb();
      const transaction = db.transaction([pagesScheme, booksScheme], 'readwrite');
      const pageStore = transaction.objectStore(pagesScheme);
      const bookStore = transaction.objectStore(booksScheme);
      
      // Get all pages for this book
      const index = pageStore.index("awid");
      const pages = await requestToPromise(index.getAll(book.awid));
      
      // Delete each page
      for (const page of pages) {
        await requestToPromise(pageStore.delete(page.id));
      }
      
      // Delete the book
      await requestToPromise(bookStore.delete(book.awid));
      
      // We should also update the search index after these deletions
      await rebuildSearchIndex(db);
      
      // Notify the background script
      notifyBackgroundScriptOfIndexUpdate();
      
      return true;
    } catch (error) {
      console.error("Error in deleteBookAndRelatedPages:", error);
      throw new Error(`Failed to delete book and related pages: ${error.message}`);
    }
  };

  // Add filtered books data
  const filteredBooksData = useMemo(() => {
    return booksData.filter(row => {
      return Object.keys(bookFilters).every(key => {
        // Skip non-data keys like 'actions'
        if (key === 'actions') return true;
        
        const filterValue = bookFilters[key]?.toLowerCase();
        const rowValue = row[key]?.toString().toLowerCase();
        return !filterValue || rowValue?.includes(filterValue);
      });
    });
  }, [booksData, bookFilters]);

  // Add sorted books data
  const sortedBooksData = useMemo(() => {
    return stableSort(filteredBooksData, getComparator(bookOrder, bookOrderBy));
  }, [filteredBooksData, bookOrder, bookOrderBy]);

  // Handle theme change
  const handleThemeChange = (event) => {
    const newThemeMode = event.target.checked ? 'dark' : 'light';
    setThemeMode(newThemeMode);
    // Optional: Save theme preference to localStorage
    localStorage.setItem('themeMode', newThemeMode);
  };

  return (
    <ThemeProvider theme={createAppTheme(themeMode)}>
      <CssBaseline />
      <div 
        className={classes.root}
        style={{ 
          backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa',
        }}
      >
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Plugin Management Tabs"
          className={classes.tabs}
          indicatorColor="primary"
          textColor="primary"
          style={{ backgroundColor: themeMode === 'dark' ? '#424242' : '#fff' }}
        >
          <Tab label="DATABASE" id="vertical-tab-0" aria-controls="vertical-tabpanel-0" />
          <Tab label="SETTINGS" id="vertical-tab-1" aria-controls="vertical-tabpanel-1" />
          <Tab label="ABOUT" id="vertical-tab-2" aria-controls="vertical-tabpanel-2" />
        </Tabs>

        {/* Database Tab Panel */}
        <Box
          role="tabpanel"
          hidden={tabIndex !== 0}
          id="vertical-tabpanel-0"
          aria-labelledby="vertical-tab-0"
          className={classes.tabPanel}
          style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa' }}
        >
          <Box 
            className={classes.headerContainer}
            style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
          >
            <Typography 
              variant="h5"
              style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
            >
              Database Content
            </Typography>
            <Box className={classes.buttonsContainer}>
              <input
                accept="application/json"
                className={classes.importInput}
                id="import-file"
                type="file"
                onChange={handleImportFile}
                ref={fileInputRef}
              />
              <Button
                variant="contained"
                color="primary"
                className={classes.importExportButton}
                startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                onClick={handleImportClick}
                disabled={isImporting || loading}
              >
                Import
              </Button>
              <Button
                variant="contained"
                color="primary"
                className={classes.importExportButton}
                startIcon={<CloudDownloadIcon />}
                onClick={handleExport}
                disabled={loading || isImporting}
              >
                Export
              </Button>
              <Button
                variant="contained"
                style={{ backgroundColor: red[700], color: 'white' }}
                startIcon={<DeleteSweepIcon />}
                onClick={handleDeleteAllClick}
                disabled={loading || isImporting}
              >
                Delete All
              </Button>
            </Box>
          </Box>

          {/* Sub-tabs for Pages and Books */}
          <Tabs
            value={subTabIndex}
            onChange={handleSubTabChange}
            indicatorColor="primary"
            textColor="primary"
            className={classes.subtabs}
            style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
          >
            <Tab 
              label="Pages" 
              icon={<PageIcon />} 
              id="sub-tab-0" 
              aria-controls="sub-tabpanel-0"
              iconPosition="start"
            />
            <Tab 
              label="Books" 
              icon={<MenuBookIcon />} 
              id="sub-tab-1" 
              aria-controls="sub-tabpanel-1"
              iconPosition="start"
            />
          </Tabs>

          {loading ? (
            <Box display="flex" justifyContent="center" my={4}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Pages Subtab Panel */}
              <Box
                role="tabpanel"
                hidden={subTabIndex !== 0}
                id="sub-tabpanel-0"
                aria-labelledby="sub-tab-0"
                className={classes.subtabContent}
                style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa' }}
              >
                <Paper 
                  className={classes.paper}
                  style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                >
                  {/* Pages Filter Row */}
                  <Box 
                    className={classes.filtersContainer}
                    style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#f9f9f9' }}
                  >
                    {headCells.filter(cell => cell.id !== 'actions').map((headCell) => (
                      <TextField
                          key={`filter-${headCell.id}`}
                          label={`Filter ${headCell.label}`}
                          value={filters[headCell.id]}
                          onChange={(e) => handleFilterChange(e, headCell.id)}
                          variant="outlined"
                          size="small"
                          className={classes.filterField}
                          InputProps={{
                            style: { backgroundColor: themeMode === 'dark' ? '#424242' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }
                          }}
                          InputLabelProps={{
                            style: { color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)' }
                          }}
                      />
                    ))}
                  </Box>
                  {/* Pages Table */}
                  <TableContainer 
                    className={classes.tableContainer}
                    style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                  >
                    <Table 
                      stickyHeader 
                      aria-label="pages table" 
                      size="small" 
                      className={classes.table}
                      style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                    >
                      <EnhancedTableHead
                        classes={classes}
                        order={order}
                        orderBy={orderBy}
                        onRequestSort={handleRequestSort}
                        themeMode={themeMode}
                      />
                      <TableBody 
                        className={classes.tableBody}
                        style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                      >
                        {sortedData.map((row) => (
                          <TableRow 
                            hover 
                            tabIndex={-1} 
                            key={row.id}
                            className={classes.tableRow}
                            style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                          >
                            <TableCell className={`${classes.tableCell} ${classes.nameColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{row.name}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.urlColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                              <Link href={row.url} target="_blank" rel="noopener noreferrer" color="primary">
                                {row.url}
                              </Link>
                            </TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.typeColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{row.type}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.bookNameColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{row.bookName}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.actionColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                              <Tooltip title="Delete">
                                <IconButton 
                                  aria-label="delete" 
                                  className={classes.deleteButton}
                                  onClick={() => handleDeleteClick(row)}
                                  size="small"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box 
                    className={classes.footer}
                    style={{ 
                      backgroundColor: themeMode === 'dark' ? '#303030' : '#f5f5f5',
                      color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)'
                    }}
                  >
                    <Typography variant="caption">
                      Total Pages: {sortedData.length} (Filtered from {data.length})
                    </Typography>
                  </Box>
                </Paper>
              </Box>

              {/* Books Subtab Panel */}
              <Box
                role="tabpanel"
                hidden={subTabIndex !== 1}
                id="sub-tabpanel-1"
                aria-labelledby="sub-tab-1"
                className={classes.subtabContent}
                style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa' }}
              >
                <Paper 
                  className={classes.paper} 
                  style={{ 
                    padding: 16,
                    backgroundColor: themeMode === 'dark' ? '#303030' : '#fff'
                  }}
                >
                  {/* Books Filter Row */}
                  <Box 
                    className={classes.filtersContainer}
                    style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#f9f9f9' }}
                  >
                    {bookHeadCells.filter(cell => cell.id !== 'actions').map((headCell) => (
                      <TextField
                          key={`book-filter-${headCell.id}`}
                          label={`Filter ${headCell.label}`}
                          value={bookFilters[headCell.id]}
                          onChange={(e) => handleBookFilterChange(e, headCell.id)}
                          variant="outlined"
                          size="small"
                          className={classes.filterField}
                          InputProps={{
                            style: { backgroundColor: themeMode === 'dark' ? '#424242' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }
                          }}
                          InputLabelProps={{
                            style: { color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)' }
                          }}
                      />
                    ))}
                  </Box>
                  {/* Books Table */}
                  <TableContainer 
                    className={classes.tableContainer}
                    style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                  >
                    <Table 
                      stickyHeader 
                      aria-label="books table" 
                      size="small" 
                      className={classes.table}
                      style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                    >
                      <BooksTableHead
                        classes={classes}
                        order={bookOrder}
                        orderBy={bookOrderBy}
                        onRequestSort={handleBookRequestSort}
                        themeMode={themeMode}
                      />
                      <TableBody 
                        className={classes.tableBody}
                        style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                      >
                        {sortedBooksData.map((book) => (
                          <TableRow 
                            hover 
                            tabIndex={-1} 
                            key={book.awid}
                            className={classes.tableRow}
                            style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff' }}
                          >
                            <TableCell className={`${classes.tableCell} ${classes.nameColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{book.name}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.awidColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{book.awid}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.dateColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{book.formattedDate}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.typeColumn}`} align="right" style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>{book.pageCount}</TableCell>
                            <TableCell className={`${classes.tableCell} ${classes.actionColumn}`} style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fff', color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                              <Tooltip title={`Delete book and ${book.pageCount} pages`}>
                                <IconButton 
                                  aria-label="delete book" 
                                  className={classes.deleteButton}
                                  onClick={() => handleDeleteBookClick(book)}
                                  size="small"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box 
                    className={classes.footer}
                    style={{ 
                      backgroundColor: themeMode === 'dark' ? '#303030' : '#f5f5f5',
                      color: themeMode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.54)'
                    }}
                  >
                    <Typography variant="caption">
                      Total Books: {sortedBooksData.length} (Filtered from {booksData.length})
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            </>
          )}
        </Box>
        
        {/* Settings Tab Panel */}
        <Box
          role="tabpanel"
          hidden={tabIndex !== 1}
          id="vertical-tabpanel-1"
          aria-labelledby="vertical-tab-1"
          className={classes.tabPanel}
          style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa' }}
        >
          <Typography 
            variant="h5" 
            gutterBottom
            style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
          >
            Settings
          </Typography>
          
          <Paper 
            className={classes.paper} 
            style={{ 
              padding: 16,
              backgroundColor: themeMode === 'dark' ? '#303030' : '#fff'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
            >
              Appearance
            </Typography>
            
            <Box display="flex" alignItems="center" my={2}>
              <Typography style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>Light</Typography>
              <Switch
                checked={themeMode === 'dark'}
                onChange={handleThemeChange}
                color="primary"
                style={{ margin: '0 8px' }}
              />
              <Typography style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>Dark</Typography>
            </Box>
          </Paper>
        </Box>
        
        {/* About Tab Panel */}
        <Box
          role="tabpanel"
          hidden={tabIndex !== 2}
          id="vertical-tabpanel-2"
          aria-labelledby="vertical-tab-2"
          className={classes.tabPanel}
          style={{ backgroundColor: themeMode === 'dark' ? '#303030' : '#fafafa' }}
        >
          <Typography 
            variant="h5" 
            gutterBottom
            style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
          >
            About uugle-vibe
          </Typography>
          
          <Paper 
            className={classes.paper} 
            style={{ 
              padding: 16,
              backgroundColor: themeMode === 'dark' ? '#303030' : '#fff'
            }}
          >
            <Typography 
              variant="h6" 
              gutterBottom
              style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}
            >
              Plugin Information
            </Typography>
            
            <Box my={2}>
              <Typography variant="body1" paragraph style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                <strong>uugle-vibe</strong> is a fresh fork and successor of the legacy uuGle Chrome extension. It brings a faster, cleaner, and more powerful way to search through Unicorn 🦄 BookKit books.
              </Typography>
              
              <Typography variant="body1" paragraph style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                <strong>Version:</strong> 1.0.0
              </Typography>
              
              <Typography variant="body1" paragraph style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                <strong>What's New in uugle-vibe:</strong>
                <ul>
                  <li>⚙️ Upgraded to Manifest V3</li>
                  <li>📦 Modernized stack — updated React, Webpack, and other dependencies</li>
                  <li>📚 Indexing now includes Management Kit pages</li>
                  <li>🧩 Plugin Management Panel
                    <ul>
                      <li>View and filter pages and books stored in the database</li>
                      <li>Delete individual pages or whole books (along with all related pages)</li>
                      <li>⭐ Mark books as favorites for easier access</li>
                      <li>📤 Export: Save entire database to a JSON file</li>
                      <li>📥 Import: Load previously exported JSON — only new records are added</li>
                      <li>🗑️ Delete all: Wipe the complete plugin database</li>
                    </ul>
                  </li>
                  <li>🔍 Popup UI improvements
                    <ul>
                      <li>Shortcut button to open the Plugin Management panel</li>
                      <li>Book filtering with :book keyword to filter search within a selected book</li>
                      <li>Selected books can be added to favorites</li>
                      <li>Slight UI refresh</li>
                    </ul>
                  </li>
                  <li>🌙 Dark mode</li>
                </ul>
              </Typography>
              
              <Typography variant="body1" paragraph style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
                <strong>Usage:</strong> Press <code style={{ backgroundColor: themeMode === 'dark' ? '#424242' : '#f5f5f5', padding: '2px 4px', borderRadius: 4 }}>Ctrl+Shift+K</code> (or <code style={{ backgroundColor: themeMode === 'dark' ? '#424242' : '#f5f5f5', padding: '2px 4px', borderRadius: 4 }}>⌘+Shift+K</code> on Mac) to open the search popup from any page. Type your search query to find relevant content.
              </Typography>
            </Box>
            
            <Typography 
              variant="h6" 
              gutterBottom
              style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)', marginTop: 24 }}
            >
              Privacy
            </Typography>
            
            <Typography variant="body1" paragraph style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
              This extension stores all data locally in your browser. No data is sent to external servers. You can export or delete your data at any time from the Database tab.
            </Typography>
            
            <Typography 
              variant="h6" 
              gutterBottom
              style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)', marginTop: 24 }}
            >
              Support
            </Typography>
            
            <Typography variant="body1" style={{ color: themeMode === 'dark' ? '#fff' : 'rgba(0, 0, 0, 0.87)' }}>
              For support, please contact your system administrator or visit the Unicorn Enterprise Platform documentation.
            </Typography>
          </Paper>
        </Box>
        
        {/* Existing Confirmation Dialog for page deletion */}
        <Dialog
          open={confirmDelete}
          onClose={handleCancelDelete}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
          PaperProps={{
            style: { backgroundColor: themeMode === 'dark' ? '#424242' : '#fff' }
          }}
        >
          <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              Are you sure you want to delete "{recordToDelete?.name}"? 
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDelete} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirmDelete} color="primary" autoFocus>
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* New Confirmation Dialog for book deletion */}
        <Dialog
          open={confirmDeleteBook}
          onClose={handleCancelDeleteBook}
          aria-labelledby="book-delete-dialog-title"
          aria-describedby="book-delete-dialog-description"
          PaperProps={{
            style: { backgroundColor: themeMode === 'dark' ? '#424242' : '#fff' }
          }}
        >
          <DialogTitle id="book-delete-dialog-title">{"Confirm Book Deletion"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="book-delete-dialog-description">
              Are you sure you want to delete the book "{bookToDelete?.name}" and all its {bookToDelete?.pageCount} pages? 
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDeleteBook} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDeleteBook} 
              style={{ color: red[700] }}
              autoFocus
            >
              Delete Book & Pages
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Delete All Confirmation Dialog */}
        <Dialog
          open={confirmDeleteAll}
          onClose={handleCancelDeleteAll}
          aria-labelledby="delete-all-dialog-title"
          aria-describedby="delete-all-dialog-description"
          PaperProps={{
            style: { backgroundColor: themeMode === 'dark' ? '#424242' : '#fff' }
          }}
        >
          <DialogTitle id="delete-all-dialog-title">{"Confirm Delete All"}</DialogTitle>
          <DialogContent>
            <DialogContentText id="delete-all-dialog-description">
              Are you sure you want to delete ALL records from the database? 
              This action cannot be undone and will remove all books and pages.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancelDeleteAll} color="primary">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmDeleteAll} 
              style={{ color: red[700] }}
              autoFocus
            >
              Delete All
            </Button>
          </DialogActions>
        </Dialog>
        
        {/* Snackbar for notifications */}
        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
        />
      </div>
    </ThemeProvider>
  );
};

export default PluginManagementPage;