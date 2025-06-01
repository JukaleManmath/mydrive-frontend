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

    useEffect(() => {
        if (open && file) {
            loadVersions();
        }
    }, [open, file]);

    const loadVersions = async () => {
        try {
            setLoading(true);
            const data = await getFileVersions(file.id);
            // Sort versions by version number in descending order
            const sortedVersions = data.sort((a, b) => b.version_number - a.version_number);
            setVersions(sortedVersions);
            // Set current version number (highest version number)
            if (sortedVersions.length > 0) {
                setCurrentVersionNumber(sortedVersions[0].version_number);
            }
            setError(null);
        } catch (err) {
            setError('Failed to load version history');
            console.error('Error loading versions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (version) => {
        try {
            setRestoreLoading(true);
            setError(null);
            await restoreVersion(file.id, version.version_number);
            setLastRestoredVersion(version.version_number);
            await loadVersions();
            onVersionRestored();
            onClose();
        } catch (err) {
            setError('Failed to restore version: ' + (err.message || 'Unknown error'));
            console.error('Error restoring version:', err);
        } finally {
            setRestoreLoading(false);
        }
    };

    const handleDelete = async (version) => {
        try {
            if (version.version_number === currentVersionNumber) {
                setError('Cannot delete the current version');
                return;
            }
            await deleteFileVersion(file.id, version.version_number);
            await loadVersions();
            setDeleteConfirm(null);
            setSelectedVersion(null);
            setPreviewContent(null);
        } catch (err) {
            setError('Failed to delete version');
            console.error('Error deleting version:', err);
        }
    };

    const handlePreview = async (version) => {
        try {
            setPreviewLoading(true);
            setError(null);
            setSelectedVersion(version);
            setPreviewContent(null);
            
            // Get the version content
            const response = await getVersionContent(file.id, version.version_number);
            if (response.content) {
                setPreviewContent(response.content);
            } else if (response.url) {
                // For binary files, show a message
                setPreviewContent('This is a binary file. Please download to view.');
            } else {
                throw new Error('No content available');
            }
        } catch (err) {
            setError('Failed to load preview: ' + (err.message || 'Unknown error'));
            console.error('Error loading preview:', err);
            setPreviewContent(null);
        } finally {
            setPreviewLoading(false);
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
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            <DialogTitle>
                Version History - {file?.filename}
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
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
                        <Box sx={{ width: '40%', borderRight: 1, borderColor: 'divider' }}>
                            <List sx={{ p: 0 }}>
                                {versions.map((version, index) => (
                                    <React.Fragment key={version.id}>
                                        <ListItem
                                            sx={{
                                                bgcolor: selectedVersion?.id === version.id ? 'action.selected' : 'transparent',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography>
                                                            Version {version.version_number}
                                                        </Typography>
                                                        {version.version_number === currentVersionNumber && (
                                                            <Chip 
                                                                label="Current" 
                                                                size="small" 
                                                                color="primary" 
                                                                variant="outlined"
                                                            />
                                                        )}
                                                    </Box>
                                                }
                                                secondary={formatDate(version.created_at)}
                                            />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Tooltip title="Preview">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handlePreview(version)}
                                                        disabled={previewLoading}
                                                    >
                                                        <PreviewIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                {version.version_number !== lastRestoredVersion && (
                                                    <>
                                                        <Tooltip title="Restore">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => handleRestore(version)}
                                                                disabled={restoreLoading}
                                                            >
                                                                <RestoreIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete">
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => setDeleteConfirm(version)}
                                                                color="error"
                                                                disabled={restoreLoading}
                                                            >
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                        </ListItem>
                                        {index < versions.length - 1 && <Divider />}
                                    </React.Fragment>
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
                    >
                        <DialogTitle>Delete Version</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to delete version {deleteConfirm.version_number}?
                                This action cannot be undone.
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                            <Button 
                                onClick={() => handleDelete(deleteConfirm)} 
                                color="error"
                                variant="contained"
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={onClose}
                    sx={{ textTransform: 'none' }}
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default VersionHistoryDialog; 