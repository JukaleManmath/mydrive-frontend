import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Typography,
    Tabs,
    Tab,
    Button,
    useTheme,
    Paper,
    CircularProgress,
    Alert,
    useMediaQuery,
} from '@mui/material';
import {
    Close as CloseIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    History as HistoryIcon,
    Info as InfoIcon,
    Visibility as PreviewIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import FileVersions from './FileVersions';

const PreviewModal = ({ open, onClose, file, fileUrl, onShare }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const { token } = useAuth();

    useEffect(() => {
        if (open && file) {
            setLoading(true);
            setError(null);
            setPreviewUrl(null);

            // Handle different file types
            const fileType = file.file_type?.toLowerCase() || '';
            
            if (fileType.startsWith('image/')) {
                setPreviewUrl(`http://localhost:8000/files/${file.id}/download`);
            } else if (fileType === 'application/pdf') {
                setPreviewUrl(`http://localhost:8000/files/${file.id}/download`);
            } else if (fileType.startsWith('text/') || 
                      fileType === 'application/json' || 
                      fileType === 'application/xml' ||
                      fileType === 'application/javascript' ||
                      fileType === 'text/javascript' ||
                      fileType === 'text/css' ||
                      fileType === 'text/html') {
                // For text files, fetch content directly
                fetch(`http://localhost:8000/files/${file.id}/content`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch file content');
                    return response.text();
                })
                .then(content => {
                    setPreviewUrl(`data:${fileType};charset=utf-8,${encodeURIComponent(content)}`);
                })
                .catch(err => {
                    console.error('Error fetching file content:', err);
                    setError('Failed to load file content');
                });
            } else {
                setError('Preview not available for this file type');
            }
            setLoading(false);
        }
    }, [open, file, token]);

    const handleDownload = async () => {
        if (!file) return;
        
        try {
            setDownloading(true);
            const response = await fetch(`http://localhost:8000/files/${file.id}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading file:', err);
            setError('Failed to download file');
        } finally {
            setDownloading(false);
        }
    };

    const renderPreview = () => {
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            );
        }

        if (error) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <Alert severity="error">{error}</Alert>
                </Box>
            );
        }

        const fileType = file?.file_type?.toLowerCase() || '';

        if (fileType.startsWith('image/')) {
            return (
                <img
                    src={previewUrl}
                    alt={file?.filename}
                    style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
                />
            );
        }

        if (fileType === 'application/pdf') {
            return (
                <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '60vh', border: 'none' }}
                    title={file?.filename}
                />
            );
        }

        if (fileType.startsWith('text/') || 
            fileType === 'application/json' || 
            fileType === 'application/xml' ||
            fileType === 'application/javascript' ||
            fileType === 'text/javascript' ||
            fileType === 'text/css' ||
            fileType === 'text/html') {
            return (
                <iframe
                    src={previewUrl}
                    style={{ width: '100%', height: '60vh', border: 'none' }}
                    title={file?.filename}
                />
            );
        }

        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="text.secondary">
                    Preview not available for this file type
                </Typography>
            </Box>
        );
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
                    minHeight: '70vh',
                }
            }}
        >
            <DialogTitle sx={{ 
                m: 0, 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: `1px solid ${theme.palette.divider}`
            }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {file.filename}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        disabled={downloading}
                        sx={{ textTransform: 'none' }}
                    >
                        Download
                    </Button>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            color: theme.palette.text.secondary,
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>

            <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                px: 2,
                bgcolor: 'background.paper'
            }}>
                <Tabs
                    value={0}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            minWidth: 120,
                            py: 2,
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'text.secondary',
                            '&.Mui-selected': {
                                color: 'primary.main',
                                fontWeight: 600,
                            },
                        },
                        '& .MuiTabs-indicator': {
                            height: 3,
                        }
                    }}
                >
                    <Tab 
                        label="Preview" 
                        icon={<PreviewIcon />} 
                        iconPosition="start"
                    />
                    <Tab 
                        label="Version History" 
                        icon={<HistoryIcon />} 
                        iconPosition="start"
                    />
                    <Tab 
                        label="File Info" 
                        icon={<InfoIcon />} 
                        iconPosition="start"
                    />
                </Tabs>
            </Box>

            <DialogContent sx={{ 
                p: 0, 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                bgcolor: 'background.default'
            }}>
                {0 === 0 && (
                    <Box sx={{ 
                        p: 3, 
                        flex: 1, 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        minHeight: '400px'
                    }}>
                        {renderPreview()}
                    </Box>
                )}
                {0 === 1 && (
                    <FileVersions file={file} />
                )}
                {0 === 2 && (
                    <Box sx={{ p: 3 }}>
                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper' }}>
                            <Box sx={{ display: 'grid', gap: 2 }}>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        File Name
                                    </Typography>
                                    <Typography variant="body1">
                                        {file.filename}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        File Type
                                    </Typography>
                                    <Typography variant="body1">
                                        {file.file_type || 'N/A'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        File Size
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatFileSize(file.file_size)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        Upload Date
                                    </Typography>
                                    <Typography variant="body1">
                                        {formatDate(file.upload_date)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                        File ID
                                    </Typography>
                                    <Typography variant="body1">
                                        {file.id}
                                    </Typography>
                                </Box>
                            </Box>
                        </Paper>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default PreviewModal; 