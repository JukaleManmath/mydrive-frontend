import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    IconButton,
    Tooltip,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Snackbar,
    useTheme,
    TextField,
    InputAdornment,
    CircularProgress,
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Download as DownloadIcon,
    InsertDriveFile as FileIcon,
    Search as SearchIcon,
    Folder as FolderIcon,
    Preview as PreviewIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getFilesSharedWithMe, getFileContent } from '../services/api';
import PreviewModal from './PreviewModal';
import axios from 'axios';

const FileItem = ({ file, onDelete, onDownload, onPreview }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    const handleToggle = () => {
        if (file.type === 'folder') {
            setExpanded(!expanded);
        }
    };

    const handleAction = (action, e) => {
        e.stopPropagation(); // Prevent folder expansion when clicking actions
        if (action === 'delete') {
            onDelete(file);
        } else if (action === 'download') {
            onDownload(file);
        } else if (action === 'preview') {
            onPreview(file);
        }
    };

    return (
        <>
            <ListItem
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                    },
                }}
            >
                <Box 
                    sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        flex: 1, 
                        cursor: file.type === 'folder' ? 'pointer' : 'default',
                        pl: file.parent_id ? 2 : 0 // Add padding for nested items
                    }} 
                    onClick={handleToggle}
                >
                    {file.type === 'folder' ? (
                        <FolderIcon sx={{ 
                            color: theme.palette.primary.main, 
                            mr: 2,
                            transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                            transition: 'transform 0.2s'
                        }} />
                    ) : (
                        <FileIcon sx={{ color: theme.palette.text.secondary, mr: 2 }} />
                    )}
                    <Typography variant="body1" sx={{ flex: 1 }}>
                        {file.filename}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {file.type !== 'folder' && (
                        <>
                            <Tooltip title="Preview">
                                <IconButton onClick={(e) => handleAction('preview', e)} size="small">
                                    <PreviewIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Download">
                                <IconButton onClick={(e) => handleAction('download', e)} size="small">
                                    <DownloadIcon />
                                </IconButton>
                            </Tooltip>
                        </>
                    )}
                    {file.permission === 'edit' && (
                        <Tooltip title="Delete">
                            <IconButton onClick={(e) => handleAction('delete', e)} size="small">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </ListItem>
            {file.type === 'folder' && expanded && file.children && file.children.length > 0 && (
                <Box sx={{ pl: 4 }}>
                    {file.children.map((child) => (
                        <FileItem
                            key={child.id}
                            file={child}
                            onDelete={onDelete}
                            onDownload={onDownload}
                            onPreview={onPreview}
                        />
                    ))}
                </Box>
            )}
        </>
    );
};

function SharedFiles() {
    const [sharedFiles, setSharedFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [previewFile, setPreviewFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const { token } = useAuth();
    const theme = useTheme();

    // Function to filter files recursively
    const filterFilesRecursively = (files, query) => {
        if (!query.trim()) return files;
        
        return files.filter(file => {
            const matchesQuery = file.filename.toLowerCase().includes(query.toLowerCase());
            if (file.type === 'folder' && file.children) {
                const filteredChildren = filterFilesRecursively(file.children, query);
                return matchesQuery || filteredChildren.length > 0;
            }
            return matchesQuery;
        }).map(file => {
            if (file.type === 'folder' && file.children) {
                return {
                    ...file,
                    children: filterFilesRecursively(file.children, query)
                };
            }
            return file;
        });
    };

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredFiles(sharedFiles);
        } else {
            setFilteredFiles(filterFilesRecursively(sharedFiles, searchQuery));
        }
    }, [searchQuery, sharedFiles]);

    const fetchSharedFiles = async () => {
        try {
            setLoading(true);
            const data = await getFilesSharedWithMe();
            console.log('Fetched shared files:', data); // Debug log
            setSharedFiles(data || []);
            setFilteredFiles(data || []);
            setError(null);
        } catch (err) {
            console.error('Error in fetchSharedFiles:', err);
            setError('Failed to fetch shared files: ' + (err.response?.data?.detail || err.message));
            setSharedFiles([]);
            setFilteredFiles([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSharedFiles();
    }, []);

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleFileClick = async (file) => {
        if (file.type === 'folder') return; // Don't do anything for folders
        
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
                // For binary files (images, PDFs)
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

    const handleDownload = async (file) => {
        if (file.type === 'folder') return; // Don't download folders
        
        try {
            const response = await axios.get(`http://localhost:8000/files/${file.id}/download`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.filename);
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

    const handleDelete = async (file) => {
        if (file.type === 'folder') return; // Don't delete folders directly
        
        setItemToDelete(file);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        
        try {
            await axios.delete(`http://localhost:8000/files/${itemToDelete.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchSharedFiles(); // Refresh the list after deletion
            setSnackbar({
                open: true,
                message: 'File deleted successfully',
                severity: 'success',
            });
        } catch (err) {
            setSnackbar({
                open: true,
                message: 'Failed to delete file',
                severity: 'error',
            });
        }
        setDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>
                Files Shared with Me
            </Typography>

            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search files..."
                value={searchQuery}
                onChange={handleSearchChange}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            {filteredFiles.length === 0 ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                    No files shared with you yet.
                </Alert>
            ) : (
                <List>
                    {filteredFiles.map((file) => (
                        <FileItem
                            key={file.id}
                            file={file}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                            onPreview={handleFileClick}
                        />
                    ))}
                </List>
            )}

            <PreviewModal
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                file={previewFile}
                fileUrl={previewUrl}
            />

            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                PaperProps={{ sx: { borderRadius: 2, minWidth: 400 } }}
            >
                <DialogTitle>Delete File</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete file "{itemToDelete?.filename}"?
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
                        onClick={handleConfirmDelete} 
                        variant="contained" 
                        color="error"
                        sx={{ textTransform: 'none' }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

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
        </Box>
    );
}

export default SharedFiles; 