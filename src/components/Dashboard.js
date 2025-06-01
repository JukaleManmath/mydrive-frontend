import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  List,
  ListItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  Tooltip,
  useTheme,
  Link,
  Container,
  Grid,
  CardActions,
  InputAdornment,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { getFilesSharedWithMe, shareFile, getRecentSharedFiles, getFileContent, getAllFiles, moveFile } from '../services/api';
import PreviewModal from './PreviewModal';
import { ShareDialog } from './ShareDialog';
import VersionHistoryDialog from './VersionHistoryDialog';

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { token, user } = useAuth();
  const theme = useTheme();
  const [path, setPath] = useState([{ id: null, filename: 'My Files' }]);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [sharedFiles, setSharedFiles] = useState([]);
  const [sharePermission, setSharePermission] = useState('read');
  const [recentSharedFiles, setRecentSharedFiles] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
  const [moveMenuAnchor, setMoveMenuAnchor] = useState(null);
  const [moveMenuOpen, setMoveMenuOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [selectedFileForVersion, setSelectedFileForVersion] = useState(null);
  const [newVersionDialogOpen, setNewVersionDialogOpen] = useState(false);
  const [selectedFileForNewVersion, setSelectedFileForNewVersion] = useState(null);

  // Handle browser navigation
  useEffect(() => {
    const handlePopState = async (event) => {
      if (event.state && event.state.path) {
        try {
          // Verify the folder still exists before navigating
          const currentFolderId = event.state.path[event.state.path.length - 1].id;
          if (currentFolderId !== null) {
            const response = await axios.get(`http://localhost:8000/files/${currentFolderId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.data) {
              // If folder doesn't exist, go back to root
              setPath([{ id: null, filename: 'My Files' }]);
              window.history.replaceState({ path: [{ id: null, filename: 'My Files' }] }, '', window.location.pathname);
              return;
            }
          }
          setPath(event.state.path);
        } catch (error) {
          // If there's an error (e.g., folder deleted), go back to root
          setPath([{ id: null, filename: 'My Files' }]);
          window.history.replaceState({ path: [{ id: null, filename: 'My Files' }] }, '', window.location.pathname);
        }
      }
    };

    // Initialize history state if not present
    if (!window.history.state) {
      window.history.replaceState({ path: path }, '', window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [token]);

  const updatePath = useCallback(async (newPath) => {
    try {
      // Verify the folder exists before updating path
      const currentFolderId = newPath[newPath.length - 1].id;
      if (currentFolderId !== null) {
        const response = await axios.get(`http://localhost:8000/files/${currentFolderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.data) {
          // If folder doesn't exist, go back to root
          setPath([{ id: null, filename: 'My Files' }]);
          window.history.replaceState({ path: [{ id: null, filename: 'My Files' }] }, '', window.location.pathname);
          return;
        }
      }
      setPath(newPath);
      // Update browser history
      window.history.pushState({ path: newPath }, '', window.location.pathname);
    } catch (error) {
      // If there's an error (e.g., folder deleted), go back to root
      setPath([{ id: null, filename: 'My Files' }]);
      window.history.replaceState({ path: [{ id: null, filename: 'My Files' }] }, '', window.location.pathname);
    }
  }, [token]);

  const fetchFiles = useCallback(async () => {
    const currentFolderId = path.length > 0 ? path[path.length - 1].id : null;
    try {
      const response = await axios.get('http://localhost:8000/files/', {
        params: { parent_id: currentFolderId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setFiles(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch files');
      setLoading(false);
    }
  }, [token, path]);

  const fetchSharedFiles = useCallback(async () => {
    try {
      const data = await getFilesSharedWithMe();
      setSharedFiles(data || []);
    } catch (err) {
      console.error('Error in fetchSharedFiles:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch shared files: ' + (err.response?.data?.detail || err.message),
        severity: 'error',
      });
      setSharedFiles([]);
    }
  }, []);

  const fetchRecentSharedFiles = useCallback(async () => {
    try {
      const files = await getRecentSharedFiles();
      setRecentSharedFiles(files);
    } catch (error) {
      console.error('Error in fetchRecentSharedFiles:', error);
      setSnackbar({
        open: true,
        message: 'Error fetching recent shared files',
        severity: 'error'
      });
    }
  }, []);

  const fetchAllFiles = useCallback(async () => {
    try {
      const data = await getAllFiles();
      setAllFiles(data);
    } catch (err) {
      console.error('Error fetching all files:', err);
    }
  }, []);

  // Single useEffect to handle all initial data fetching
  useEffect(() => {
    if (token) {
      const fetchAllData = async () => {
        setLoading(true);
        try {
          await Promise.all([
            fetchFiles(),
            fetchSharedFiles(),
            fetchRecentSharedFiles(),
            fetchAllFiles()
          ]);
        } catch (error) {
          console.error('Error fetching data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllData();
    }
  }, [token, fetchFiles, fetchSharedFiles, fetchRecentSharedFiles, fetchAllFiles]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      // When search is cleared, show files in the current folder
      const currentFolderId = path.length > 0 ? path[path.length - 1].id : null;
      const filesInCurrentFolder = files.filter(file => file.parent_id === currentFolderId);
      setFilteredFiles(filesInCurrentFolder);
    } else {
      // When searching, if we're in a folder, search only within that folder
      const currentFolderId = path.length > 0 ? path[path.length - 1].id : null;
      const query = searchQuery.toLowerCase();
      
      if (currentFolderId !== null) {
        // Search within current folder using files array
        const filtered = files.filter(file => 
          file.parent_id === currentFolderId && (
            file.filename.toLowerCase().includes(query) ||
            (file.file_type && file.file_type.toLowerCase().includes(query))
          )
        );
        setFilteredFiles(filtered);
      } else {
        // Search across all files when at root
        const filtered = allFiles.filter(file => 
          file.filename.toLowerCase().includes(query) ||
          (file.file_type && file.file_type.toLowerCase().includes(query))
        );
        setFilteredFiles(filtered);
      }
    }
  }, [searchQuery, files, allFiles, path]);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleFolderClick = async (folder) => {
    const newPath = [...path, { id: folder.id, filename: folder.filename }];
    await updatePath(newPath);
  };

  const handleBreadcrumbClick = async (index) => {
    const newPath = path.slice(0, index + 1);
    await updatePath(newPath);
  };

  const handleCreateFolderClick = () => {
    setCreateFolderDialogOpen(true);
  };

  const handleCreateFolderSubmit = async () => {
    if (!newFolderName.trim()) {
      setSnackbar({
        open: true,
        message: 'Folder name cannot be empty.',
        severity: 'warning',
      });
      return;
    }

    try {
      const currentFolderId = path.length > 0 ? path[path.length - 1].id : null;
      await axios.post('http://localhost:8000/folders/', 
        { filename: newFolderName, parent_id: currentFolderId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNewFolderName('');
      setCreateFolderDialogOpen(false);
      fetchFiles();
      setSnackbar({
        open: true,
        message: 'Folder created successfully',
        severity: 'success',
      });
    } catch (err) {
      let errorMessage = 'Failed to create folder';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = `Failed to create folder: ${err.response.data.detail}`;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const currentFolderId = path.length > 0 ? path[path.length - 1].id : null;

    if (currentFolderId !== null) {
      formData.append('parent_id', currentFolderId);
    }

    try {
      await axios.post('http://localhost:8000/files/upload', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchFiles();
      setSnackbar({
        open: true,
        message: 'File uploaded successfully',
        severity: 'success',
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to upload file',
        severity: 'error',
      });
    }
  };

  const handleConfirmDelete = (item) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    const itemId = itemToDelete.id;
    const itemName = itemToDelete.filename;
    const itemType = itemToDelete.type;

    setDeleteDialogOpen(false);
    setItemToDelete(null);

    try {
      await axios.delete(`http://localhost:8000/files/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchFiles();
      setSnackbar({
        open: true,
        message: `${itemType === 'folder' ? 'Folder' : 'File'} '${itemName}' deleted successfully`,
        severity: 'success',
      });
    } catch (err) {
      let errorMessage = `Failed to delete ${itemType === 'folder' ? 'folder' : 'file'}`;
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = `${errorMessage}: ${err.response.data.detail}`;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleShare = (file) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  const handleShareClose = () => {
    setShareDialogOpen(false);
    setSelectedFile(null);
  };

  const handleShareSubmit = async (email, permission) => {
    if (!selectedFile) return;

    try {
      await shareFile(selectedFile.id, email, permission);
      setSnackbar({
        open: true,
        message: 'File shared successfully',
        severity: 'success'
      });
      handleShareClose();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Failed to share file',
        severity: 'error'
      });
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await axios.get(`http://localhost:8000/files/${fileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSnackbar({
        open: true,
        message: 'File downloaded successfully',
        severity: 'success',
      });
    } catch (err) {
      console.error('Error downloading file:', err);
      setSnackbar({
        open: true,
        message: 'Failed to download file',
        severity: 'error',
      });
    }
  };

  const getFileIcon = () => {
    return <FileIcon sx={{ color: theme.palette.primary.main, fontSize: 32 }} />;
  };

  const handleFileClick = async (file) => {
    if (file.type === 'folder') {
      // If we're in search mode (searchQuery is not empty)
      if (searchQuery.trim() !== '') {
        // Clear the search and navigate to the folder
        setSearchQuery('');
        // Find the folder's path by traversing up the parent chain
        const folderPath = [];
        let currentFile = file;
        while (currentFile) {
          folderPath.unshift({ id: currentFile.id, filename: currentFile.filename });
          // Find the parent in allFiles
          currentFile = allFiles.find(f => f.id === currentFile.parent_id);
        }
        // Add root if not present
        if (folderPath.length > 0 && folderPath[0].id !== null) {
          folderPath.unshift({ id: null, filename: 'My Files' });
        }
        await updatePath(folderPath);
      } else {
        // Normal folder navigation
        handleFolderClick(file);
      }
      return;
    }

    try {
      setLoading(true);
      setPreviewFile(null);
      setPreviewUrl(null);
      setPreviewOpen(false);

      const response = await getFileContent(file.id);
      
      if (!response) {
        throw new Error('No response received from server');
      }

      setPreviewFile(file);
      
      if (response.content) {
        // For text files
        setPreviewUrl(null);
        file.content = response.content;
      } else if (response.url) {
        // For images and PDFs
        setPreviewUrl(response.url);
      } else {
        throw new Error('Invalid response format from server');
      }
      
      setPreviewOpen(true);
    } catch (error) {
      console.error('Error getting file content:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to preview file',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMoveClick = (item, event) => {
    event.stopPropagation();
    setSelectedItem(item);
    setMoveMenuAnchor(event.currentTarget);
    setMoveMenuOpen(true);
  };

  const handleMoveMenuClose = () => {
    setMoveMenuAnchor(null);
    setMoveMenuOpen(false);
  };

  const handleMoveDialogOpen = () => {
    setItemToMove(selectedItem);
    setMoveDialogOpen(true);
    handleMoveMenuClose();
  };

  const handleMove = async (targetParentId) => {
    if (!itemToMove) return;

    try {
      await moveFile(itemToMove.id, targetParentId);
      setMoveDialogOpen(false);
      setItemToMove(null);
      fetchFiles();
      setSnackbar({
        open: true,
        message: `${itemToMove.type === 'folder' ? 'Folder' : 'File'} moved successfully`,
        severity: 'success',
      });
    } catch (err) {
      let errorMessage = `Failed to move ${itemToMove.type === 'folder' ? 'folder' : 'file'}`;
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = `${errorMessage}: ${err.response.data.detail}`;
      }
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    }
  };

  const handleVersionHistory = (file) => {
    setSelectedFileForVersion(file);
    setVersionHistoryOpen(true);
  };

  const handleVersionRestored = () => {
    fetchFiles();
    setSnackbar({
      open: true,
      message: 'Version restored successfully',
      severity: 'success',
    });
  };

  const handleNewVersion = async (event) => {
    const file = event.target.files[0];
    if (!file || !selectedFileForNewVersion) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('comment', 'New version uploaded');

      await axios.post(
        `http://localhost:8000/files/${selectedFileForNewVersion.id}/versions`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setSnackbar({
        open: true,
        message: 'New version uploaded successfully',
        severity: 'success'
      });
      setNewVersionDialogOpen(false);
      setSelectedFileForNewVersion(null);
      fetchFiles();
    } catch (err) {
      console.error('Error uploading new version:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.detail || 'Failed to upload new version',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box 
        sx={{
          mb: 4,
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          bgcolor: 'background.paper',
          boxShadow: theme.shadows[1],
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
          Welcome{user?.username ? `, ${user.username}` : ''}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your files effortlessly.
        </Typography>
      </Box>

      <Card 
        elevation={0} 
        sx={{ 
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: theme.shadows[3],
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box 
            sx={{ 
              p: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: 'background.default'
            }}
          >
            <Typography 
              variant="h6" 
              sx={{ 
                display: 'flex',
                alignItems: 'center',
                fontWeight: 600
              }}
            >
              <FolderIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
              My Files
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                variant="outlined"
                placeholder="Search files..."
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ width: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                variant="outlined"
                startIcon={<FolderIcon />}
                onClick={handleCreateFolderClick}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  boxShadow: 'none',
                }}
              >
                New Folder
              </Button>

              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3,
                  py: 1,
                  boxShadow: 'none',
                }}
              >
                Upload File
                <input type="file" hidden onChange={handleFileUpload} />
              </Button>
            </Box>
          </Box>

          <Box sx={{ mb: 2, px: 3 }}>
            {path.map((folder, index) => (
              <React.Fragment key={folder.id || 'root'}>
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => handleBreadcrumbClick(index)}
                  sx={{
                    color: index === path.length - 1 ? 'text.primary' : 'text.secondary',
                    fontWeight: index === path.length - 1 ? 600 : 400,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {folder.filename}
                </Link>
                {index < path.length - 1 && <Typography component="span" sx={{ mx: 1 }}>/</Typography>}
              </React.Fragment>
            ))}
          </Box>

          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                mx: 3, 
                mt: 3,
                borderRadius: 1
              }}
            >
              {error}
            </Alert>
          )}

          {filteredFiles.length === 0 ? (
            <Box 
              sx={{ 
                textAlign: 'center', 
                py: 8,
                px: 3
              }}
            >
              <FileIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchQuery ? 'No matching files found' : 'No files uploaded yet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {searchQuery ? 'Try a different search term' : 'Click the upload button to add files to your drive'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredFiles.map((item, index) => (
                <ListItem
                  key={item.id}
                  sx={{
                    py: 2.5,
                    px: 3,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleFileClick(item)}
                >
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <Box sx={{ flexShrink: 0, mr: 2 }}>
                      {item.type === 'folder' ? (
                        <FolderIcon sx={{ color: theme.palette.warning.main, fontSize: 32 }} />
                      ) : (
                        getFileIcon()
                      )}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography 
                        variant="body1" 
                        noWrap
                      >
                        {item.filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.type === 'folder' ? 'Folder' : item.file_type || 'File'}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {item.type !== 'folder' && (
                      <>
                        <Tooltip title="Preview">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            handleFileClick(item);
                          }} size="small">
                            <PreviewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.id, item.filename);
                          }} size="small">
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    )}
                    <Tooltip title="More options">
                      <IconButton onClick={(e) => handleMoveClick(item, e)} size="small">
                        <MoreVertIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={createFolderDialogOpen} onClose={() => setCreateFolderDialogOpen(false)} PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            type="text"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolderSubmit();
              }
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCreateFolderDialogOpen(false)} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button onClick={handleCreateFolderSubmit} variant="contained" sx={{ textTransform: 'none' }}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <PreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        file={previewFile}
        fileUrl={previewUrl}
        onShare={handleShare}
      />

      <ShareDialog
        open={shareDialogOpen}
        onClose={handleShareClose}
        onSubmit={handleShareSubmit}
        fileName={selectedFile?.filename}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Recent Shared Files Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          Recently Shared Files
        </Typography>
        {recentSharedFiles.length === 0 ? (
          <Typography color="text.secondary">No files have been shared with you recently.</Typography>
        ) : (
          <List sx={{ p: 0 }}>
            {recentSharedFiles.map((file, index) => (
              <React.Fragment key={file.id}>
                <ListItem
                  sx={{
                    py: 2,
                    px: 3,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <Box 
                    sx={{ 
                      flexShrink: 0, 
                      mr: 2,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleFileClick(file)}
                  >
                    <FileIcon sx={{ color: theme.palette.primary.main, fontSize: 28 }} />
                  </Box>
                  <Box 
                    sx={{ 
                      minWidth: 0, 
                      flex: 1,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleFileClick(file)}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.filename}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Size: {Math.round(file.file_size / 1024)} KB • Type: {file.file_type} • Permission: {file.permission === 'edit' ? 'Can Edit' : 'Read Only'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Download">
                      <IconButton
                        size="small"
                        edge="end"
                        aria-label="download"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(file.id, file.filename);
                        }}
                        sx={{
                          color: theme.palette.primary.main,
                          '&:hover': {
                            bgcolor: 'rgba(37, 99, 235, 0.08)',
                          }
                        }}
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    {file.permission === 'edit' && (
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          edge="end"
                          aria-label="delete"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmDelete(file);
                          }}
                          sx={{
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: 'rgba(239, 68, 68, 0.08)',
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItem>
                {index < recentSharedFiles.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Add Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle>
          Delete {itemToDelete?.type === 'folder' ? 'Folder' : 'File'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {itemToDelete?.type === 'folder' ? 'folder' : 'file'} "{itemToDelete?.filename}"?
            {itemToDelete?.type === 'folder' && ' This will also delete all contents inside the folder.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            sx={{ textTransform: 'none' }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Move Menu */}
      <Menu
        anchorEl={moveMenuAnchor}
        open={moveMenuOpen}
        onClose={handleMoveMenuClose}
      >
        <MenuItem onClick={handleMoveDialogOpen}>Move to...</MenuItem>
        {selectedItem?.type !== 'folder' && (
          <>
            <MenuItem onClick={() => {
              handleShare(selectedItem);
              handleMoveMenuClose();
            }}>Share</MenuItem>
            <MenuItem onClick={() => {
              handleVersionHistory(selectedItem);
              handleMoveMenuClose();
            }}>Version History</MenuItem>
            <MenuItem onClick={() => {
              setSelectedFileForNewVersion(selectedItem);
              setNewVersionDialogOpen(true);
              handleMoveMenuClose();
            }}>Upload New Version</MenuItem>
          </>
        )}
        <MenuItem onClick={() => {
          handleConfirmDelete(selectedItem);
          handleMoveMenuClose();
        }}>Delete</MenuItem>
      </Menu>

      {/* Move Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={() => setMoveDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle>
          Move {itemToMove?.type === 'folder' ? 'Folder' : 'File'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Select destination folder:
          </Typography>
          <List>
            {/* Show parent folder option if we're in a subfolder */}
            {path.length > 1 && (
              <ListItem
                button
                onClick={() => handleMove(path[path.length - 2].id)}
                sx={{
                  borderRadius: 1,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <FolderIcon sx={{ color: theme.palette.warning.main, mr: 2 }} />
                <Typography>.. (Parent Folder)</Typography>
              </ListItem>
            )}

            {/* Current level folders */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2 }}>
                Current Level Folders
              </Typography>
            </Box>
            {allFiles
              .filter(f => 
                f.type === 'folder' && 
                f.id !== itemToMove?.id && 
                f.id !== path[path.length - 1].id &&
                f.parent_id === path[path.length - 1].id
              )
              .map((folder) => (
                <ListItem
                  key={folder.id}
                  button
                  onClick={() => handleMove(folder.id)}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                  }}
                >
                  <FolderIcon sx={{ color: theme.palette.warning.main, mr: 2 }} />
                  <Typography>{folder.filename}</Typography>
                </ListItem>
              ))}

            {/* Subfolders organized by parent */}
            <Box sx={{ mt: 2, mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ px: 2 }}>
                Other Folders
              </Typography>
            </Box>
            {(() => {
              // Group folders by their parent
              const foldersByParent = {};
              allFiles
                .filter(f => 
                  f.type === 'folder' && 
                  f.id !== itemToMove?.id && 
                  f.id !== path[path.length - 1].id &&
                  f.parent_id !== path[path.length - 1].id
                )
                .forEach(folder => {
                  const parentId = folder.parent_id;
                  if (!foldersByParent[parentId]) {
                    foldersByParent[parentId] = [];
                  }
                  foldersByParent[parentId].push(folder);
                });

              // Render folders grouped by parent
              return Object.entries(foldersByParent).map(([parentId, folders]) => {
                const parentFolder = allFiles.find(f => f.id === parseInt(parentId));
                const parentName = parentFolder ? parentFolder.filename : 'Root';

                return (
                  <Box key={parentId} sx={{ mb: 2 }}>
                    <Typography 
                      variant="subtitle2" 
                      color="text.secondary" 
                      sx={{ px: 2, py: 1, bgcolor: 'action.hover' }}
                    >
                      {parentName}
                    </Typography>
                    {folders.map(folder => (
                      <ListItem
                        key={folder.id}
                        button
                        onClick={() => handleMove(folder.id)}
                        sx={{
                          borderRadius: 1,
                          pl: 4,
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                        }}
                      >
                        <FolderIcon sx={{ color: theme.palette.warning.main, mr: 2 }} />
                        <Typography>{folder.filename}</Typography>
                      </ListItem>
                    ))}
                  </Box>
                );
              });
            })()}

            {allFiles.filter(f => 
              f.type === 'folder' && 
              f.id !== itemToMove?.id && 
              f.id !== path[path.length - 1].id
            ).length === 0 && (
              <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No other folders available to move to
              </Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setMoveDialogOpen(false)} 
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Version History Dialog */}
      <VersionHistoryDialog
        open={versionHistoryOpen}
        onClose={() => setVersionHistoryOpen(false)}
        file={selectedFileForVersion}
        onVersionRestored={handleVersionRestored}
      />

      {/* New Version Dialog */}
      <Dialog
        open={newVersionDialogOpen}
        onClose={() => {
          setNewVersionDialogOpen(false);
          setSelectedFileForNewVersion(null);
        }}
        PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
      >
        <DialogTitle>Upload New Version</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Select a new version of "{selectedFileForNewVersion?.filename}"
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              px: 3,
              py: 1,
              boxShadow: 'none',
            }}
          >
            Choose File
            <input type="file" hidden onChange={handleNewVersion} />
          </Button>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => {
              setNewVersionDialogOpen(false);
              setSelectedFileForNewVersion(null);
            }}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Dashboard; 