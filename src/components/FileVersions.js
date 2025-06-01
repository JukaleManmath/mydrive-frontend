import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Alert,
    Snackbar,
    CircularProgress,
    useTheme,
    Paper,
    Divider
} from '@mui/material';
import {
    Restore as RestoreIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    History as HistoryIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

function FileVersions({ file, onVersionRestored }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [createVersionDialogOpen, setCreateVersionDialogOpen] = useState(false);
    const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [newVersionComment, setNewVersionComment] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const { token } = useAuth();
    const theme = useTheme();

    const fetchVersions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(
                `http://localhost:8000/files/${file.id}/versions`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setVersions(response.data);
        } catch (err) {
            console.error('Error fetching versions:', err);
            setError('Failed to load versions');
            setSnackbar({
                open: true,
                message: 'Failed to load versions',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (file) {
            fetchVersions();
        }
    }, [file]);

    const handleCreateVersion = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            if (newVersionComment) {
                formData.append('comment', newVersionComment);
            }

            await axios.post(
                `http://localhost:8000/files/${file.id}/versions`,
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
                message: 'Version created successfully',
                severity: 'success'
            });
            setCreateVersionDialogOpen(false);
            setNewVersionComment('');
            fetchVersions();
        } catch (err) {
            console.error('Error creating version:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to create version',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreVersion = async () => {
        if (!selectedVersion) return;

        try {
            setLoading(true);
            await axios.post(
                `http://localhost:8000/files/versions/${selectedVersion.id}/restore`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSnackbar({
                open: true,
                message: 'Version restored successfully',
                severity: 'success'
            });
            setRestoreDialogOpen(false);
            setSelectedVersion(null);
            fetchVersions();
            if (onVersionRestored) {
                onVersionRestored();
            }
        } catch (err) {
            console.error('Error restoring version:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to restore version',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteVersion = async () => {
        if (!selectedVersion) return;

        try {
            setLoading(true);
            await axios.delete(
                `http://localhost:8000/files/${file.id}/versions/${selectedVersion.version_number}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setSnackbar({
                open: true,
                message: 'Version deleted successfully',
                severity: 'success'
            });
            setDeleteDialogOpen(false);
            setSelectedVersion(null);
            fetchVersions();
        } catch (err) {
            console.error('Error deleting version:', err);
            setSnackbar({
                open: true,
                message: err.response?.data?.detail || 'Failed to delete version',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading && versions.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon /> Version History
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateVersionDialogOpen(true)}
                    disabled={loading}
                    sx={{ textTransform: 'none' }}
                >
                    Create Version
                </Button>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
                <List>
                    {versions.map((version, index) => (
                        <React.Fragment key={version.id}>
                            <ListItem
                                sx={{
                                    '&:hover': {
                                        bgcolor: 'action.hover'
                                    }
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                Version {version.version_number}
                                            </Typography>
                                            {version.is_current && (
                                                <Typography
                                                    variant="caption"
                                                    sx={{
                                                        bgcolor: 'primary.main',
                                                        color: 'primary.contrastText',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Current
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box sx={{ mt: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {formatDate(version.created_at)}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Size: {formatFileSize(version.file_size)}
                                            </Typography>
                                            {version.comment && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                                    {version.comment}
                                                </Typography>
                                            )}
                                        </Box>
                                    }
                                />
                                <ListItemSecondaryAction>
                                    {!version.is_current && (
                                        <>
                                            <IconButton
                                                edge="end"
                                                onClick={() => {
                                                    setSelectedVersion(version);
                                                    setRestoreDialogOpen(true);
                                                }}
                                                disabled={loading}
                                                sx={{ mr: 1 }}
                                            >
                                                <RestoreIcon />
                                            </IconButton>
                                            <IconButton
                                                edge="end"
                                                onClick={() => {
                                                    setSelectedVersion(version);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                disabled={loading}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </>
                                    )}
                                </ListItemSecondaryAction>
                            </ListItem>
                            {index < versions.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>

            {/* Create Version Dialog */}
            <Dialog
                open={createVersionDialogOpen}
                onClose={() => setCreateVersionDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Create New Version</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Version Comment (Optional)"
                        multiline
                        rows={3}
                        value={newVersionComment}
                        onChange={(e) => setNewVersionComment(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setCreateVersionDialogOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateVersion}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Create Version'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Restore Version Dialog */}
            <Dialog
                open={restoreDialogOpen}
                onClose={() => setRestoreDialogOpen(false)}
            >
                <DialogTitle>Restore Version</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to restore version {selectedVersion?.version_number}?
                        This will create a new version with the content from the selected version.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setRestoreDialogOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleRestoreVersion}
                        variant="contained"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Restore'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Version Dialog */}
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <DialogTitle>Delete Version</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete version {selectedVersion?.version_number}?
                        This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setDeleteDialogOpen(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleDeleteVersion}
                        variant="contained"
                        color="error"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    severity={snackbar.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default FileVersions; 