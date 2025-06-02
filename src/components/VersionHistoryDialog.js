import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    Typography,
    Box,
    CircularProgress,
    IconButton,
    Tooltip,
    Divider,
    Alert,
    Chip,
} from '@mui/material';
import {
    Restore as RestoreIcon,
    Preview as PreviewIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { getFileVersions, restoreVersion, deleteFileVersion, getVersionContent } from '../services/api';
import { useTheme } from '@mui/material/styles';

function VersionHistoryDialog({ open, onClose, file, onVersionRestored }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [currentVersionNumber, setCurrentVersionNumber] = useState(null);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [lastRestoredVersion, setLastRestoredVersion] = useState(null);
    const theme = useTheme();

    useEffect(() => {
        if (open && file) {
            loadVersions();
        }
    }, [open, file]);

    const loadVersions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getFileVersions(file.id);
            setVersions(response);
            setCurrentVersionNumber(response[0]?.version_number || null);
        } catch (err) {
            console.error('Error loading versions:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to load version history');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (version) => {
        try {
            setPreviewLoading(true);
            setError(null);
            setSelectedVersion(version);
            setPreviewContent(null);
            
            const response = await getVersionContent(file.id, version.version_number);
            if (response.content) {
                setPreviewContent(response.content);
            } else if (response.url) {
                setPreviewContent('This is a binary file. Please download to view.');
            } else {
                throw new Error('No content available');
            }
        } catch (err) {
            console.error('Error loading preview:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to load preview');
            setPreviewContent(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleRestore = async (version) => {
        try {
            setRestoreLoading(true);
            setError(null);
            await restoreVersion(file.id, version.version_number);
            setLastRestoredVersion(version.version_number);
            onVersionRestored();
            setSnackbar({
                open: true,
                message: 'Version restored successfully',
                severity: 'success'
            });
        } catch (err) {
            console.error('Error restoring version:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to restore version');
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleDelete = async (version) => {
        try {
            await deleteFileVersion(file.id, version.version_number);
            setDeleteConfirm(null);
            loadVersions();
            setSnackbar({
                open: true,
                message: 'Version deleted successfully',
                severity: 'success'
            });
        } catch (err) {
            console.error('Error deleting version:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to delete version');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ 
                sx: { 
                    borderRadius: 2,
                    boxShadow: theme.shadows[24]
                } 
            }}
        >
            <DialogTitle sx={{ 
                borderBottom: `1px solid ${theme.palette.divider}`,
                pb: 2
            }}>
                Version History - {file?.filename}
            </DialogTitle>
            <DialogContent sx={{ mt: 2 }}>
                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: 2,
                            borderRadius: 1
                        }}
                    >
                        {error}
                    </Alert>
                )}
                
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', height: '400px' }}>
                        {/* Version List */}
                        <Box sx={{ width: '40%', borderRight: `1px solid ${theme.palette.divider}`, p: 2 }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Versions
                            </Typography>
                            <List sx={{ overflow: 'auto', maxHeight: '350px' }}>
                                {versions.map((version) => (
                                    <ListItem
                                        key={version.version_number}
                                        button
                                        selected={selectedVersion?.version_number === version.version_number}
                                        onClick={() => handlePreview(version)}
                                        sx={{
                                            borderRadius: 1,
                                            mb: 1,
                                            '&.Mui-selected': {
                                                bgcolor: 'primary.light',
                                                '&:hover': {
                                                    bgcolor: 'primary.light',
                                                }
                                            }
                                        }}
                                    >
                                        <ListItemText
                                            primary={`Version ${version.version_number}`}
                                            secondary={formatDate(version.created_at)}
                                        />
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {version.version_number !== currentVersionNumber && (
                                                <>
                                                    <Tooltip title="Restore">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRestore(version);
                                                            }}
                                                            disabled={restoreLoading}
                                                        >
                                                            <RestoreIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteConfirm(version);
                                                            }}
                                                        >
                                                            <DeleteIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        </Box>

                        {/* Preview Panel */}
                        <Box sx={{ width: '60%', p: 2, overflow: 'auto' }}>
                            {previewLoading ? (
                                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                                    <CircularProgress />
                                </Box>
                            ) : selectedVersion ? (
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                        Version {selectedVersion.version_number} - {formatDate(selectedVersion.created_at)}
                                    </Typography>
                                    <Box
                                        component="pre"
                                        sx={{
                                            p: 2,
                                            bgcolor: 'background.default',
                                            borderRadius: 1,
                                            overflow: 'auto',
                                            maxHeight: '300px',
                                            fontFamily: 'monospace',
                                            fontSize: '0.875rem',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {previewContent}
                                    </Box>
                                </Box>
                            ) : (
                                <Box
                                    display="flex"
                                    justifyContent="center"
                                    alignItems="center"
                                    height="100%"
                                >
                                    <Typography color="text.secondary">
                                        Select a version to preview
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                )}

                {/* Delete Confirmation Dialog */}
                {deleteConfirm && (
                    <Dialog
                        open={Boolean(deleteConfirm)}
                        onClose={() => setDeleteConfirm(null)}
                        maxWidth="xs"
                        fullWidth
                        PaperProps={{
                            sx: {
                                borderRadius: 2
                            }
                        }}
                    >
                        <DialogTitle>Delete Version</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to delete version {deleteConfirm.version_number}?
                                This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            <Button 
                                onClick={() => setDeleteConfirm(null)}
                                sx={{ 
                                    textTransform: 'none',
                                    borderRadius: 1
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={() => handleDelete(deleteConfirm)} 
                                color="error"
                                variant="contained"
                                sx={{ 
                                    textTransform: 'none',
                                    borderRadius: 1
                                }}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </DialogContent>
            <DialogActions sx={{ 
                px: 3, 
                pb: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 2
            }}>
                <Button
                    onClick={onClose}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 1
                    }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default VersionHistoryDialog; 