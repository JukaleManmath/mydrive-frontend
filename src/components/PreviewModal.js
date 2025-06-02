import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    IconButton,
    Box,
    Typography,
    CircularProgress,
    Alert,
    useTheme,
    useMediaQuery,
    Tooltip,
    Button,
    Divider,
    Paper
} from '@mui/material';
import {
    Close as CloseIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    Description as TextIcon,
    InsertDriveFile as FileIcon,
    Download as DownloadIcon,
    Share as ShareIcon,
    Info as InfoIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { downloadFile, getFileContent } from '../services/api';

const PreviewModal = ({ open, onClose, file, onShare }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewContent, setPreviewContent] = useState(null);
    const [downloading, setDownloading] = useState(false);
    const [showInfo, setShowInfo] = useState(false);
    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        if (open && file) {
            setLoading(true);
            setError(null);
            setPreviewUrl(null);
            setPreviewContent(null);

            const loadPreview = async () => {
                try {
                    console.log('Loading preview for file:', file);
                    const response = await getFileContent(file.id);
                    console.log('File content response:', response);
                    
                    if (response.content) {
                        console.log('Setting text content preview');
                        setPreviewContent(response.content);
                    } else if (response.url) {
                        console.log('Setting binary file preview URL:', response.url);
                        setPreviewUrl(response.url);
                    } else {
                        console.error('Invalid response format:', response);
                        throw new Error('Invalid response format from server');
                    }
                } catch (err) {
                        console.error('Error loading preview:', err);
                    setError(err.message || 'Failed to load preview');
                } finally {
                setLoading(false);
            }
            };

            loadPreview();
        }

        // Cleanup function
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [open, file]);

    // Debug: Log preview modal state
    useEffect(() => {
        if (open && file) {
            console.log('DEBUG: PreviewModal file:', file);
            console.log('DEBUG: PreviewModal fileType:', file?.file_type);
            console.log('DEBUG: PreviewModal previewContent:', previewContent);
            console.log('DEBUG: PreviewModal previewUrl:', previewUrl);
        }
    }, [open, file, previewContent, previewUrl]);

    const getFileIcon = () => {
        if (!file) return <FileIcon />;
        const fileType = (file.mime_type || file.file_type || '').toLowerCase();
        if (fileType.startsWith('image/')) return <ImageIcon />;
        if (fileType === 'application/pdf') return <PdfIcon />;
        if (fileType.startsWith('text/')) return <TextIcon />;
        return <FileIcon />;
    };

    const handleDownload = async () => {
        if (!file) return;
        setDownloading(true);
        try {
            const blob = await downloadFile(file.id);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', file.filename || file.name);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Error downloading file:', err);
            setError(err.message);
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
        if (!file) return null;
        const fileType = (file.mime_type || file.file_type || '').toLowerCase();
        const displayName = file.filename || file.name;

        if (previewUrl) {
            if (fileType.startsWith('image/')) {
                return (
                    <Box sx={{ 
                        width: '100%', 
                        height: '65vh', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        bgcolor: '#f8f8f8',
                        borderRadius: 2,
                        p: 2
                    }}>
                        <img 
                            src={previewUrl} 
                            alt={displayName} 
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%', 
                                objectFit: 'contain',
                                borderRadius: 4
                            }} 
                        />
                    </Box>
                );
            }
            if (fileType === 'application/pdf') {
                return (
                    <Box sx={{ 
                        width: '100%', 
                        height: '65vh', 
                        overflow: 'auto', 
                        bgcolor: '#f8f8f8', 
                        borderRadius: 2, 
                        p: 1 
                    }}>
                        <iframe 
                            src={previewUrl} 
                            style={{ 
                                width: '100%', 
                                height: '100%', 
                                border: 'none', 
                                minHeight: 500,
                                borderRadius: 4
                            }} 
                            title={displayName} 
                        />
                    </Box>
                );
            }
            // Fallback for other binary types
            return (
                <Box sx={{ 
                    width: '100%', 
                    height: '65vh', 
                    overflow: 'auto', 
                    bgcolor: '#f8f8f8', 
                    borderRadius: 2, 
                    p: 1 
                }}>
                    <iframe 
                        src={previewUrl} 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            border: 'none', 
                            minHeight: 400,
                            borderRadius: 4
                        }} 
                        title={displayName} 
                    />
                </Box>
            );
        }
        if (previewContent || file.content) {
            return (
                <Box sx={{ 
                    width: '100%',
                    height: '65vh',
                    overflow: 'auto',
                    bgcolor: '#f8f8f8',
                    borderRadius: 2,
                    p: 2
                }}>
                    <pre style={{ 
                        margin: 0, 
                        height: '100%',
                        overflow: 'auto', 
                        fontSize: 15, 
                        background: '#ffffff',
                        borderRadius: 4, 
                        padding: 16,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                    }}>
                        {previewContent || file.content}
                    </pre>
                </Box>
            );
        }
        // Fallback for unsupported types
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <Typography color="text.secondary">Preview not available for this file type</Typography>
            </Box>
        );
    };

    const renderFileInfo = () => {
        if (!file) return null;

        return (
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTop: `1px solid ${theme.palette.grey[200]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        File Information
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={() => setShowInfo(false)}
                        sx={{ 
                            color: theme.palette.grey[500],
                            '&:hover': {
                                bgcolor: 'rgba(37, 99, 235, 0.08)',
                                color: theme.palette.primary.main
                            }
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: theme.palette.text.secondary }}>Name:</span>
                        <span style={{ color: theme.palette.text.primary }}>{file.filename || file.name}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: theme.palette.text.secondary }}>Type:</span>
                        <span style={{ color: theme.palette.text.primary }}>{file.file_type || 'Unknown'}</span>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: theme.palette.text.secondary }}>Size:</span>
                        <span style={{ color: theme.palette.text.primary }}>{(file.file_size / 1024).toFixed(2)} KB</span>
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: theme.palette.text.secondary }}>Modified:</span>
                        <span style={{ color: theme.palette.text.primary }}>{new Date(file.updated_at).toLocaleString()}</span>
                    </Typography>
                </Box>
            </Paper>
        );
    };

    const renderActions = () => {
        if (!file) return null;

        return (
            <Paper 
                elevation={0}
                sx={{ 
                    p: 2,
                    bgcolor: 'background.paper',
                    borderTop: `1px solid ${theme.palette.grey[200]}`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                        Actions
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={() => setShowActions(false)}
                        sx={{ 
                            color: theme.palette.grey[500],
                            '&:hover': {
                                bgcolor: 'rgba(37, 99, 235, 0.08)',
                                color: theme.palette.primary.main
                            }
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                    <Button
                    variant="outlined"
                    color="primary"
                        onClick={handleDownload}
                        disabled={downloading}
                        sx={{ 
                        marginTop: 1,
                        marginBottom: 1
                        }}
                    >
                    {downloading ? 'Downloading...' : 'Download'}
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => onShare(file)}
                        sx={{ 
                            marginTop: 1,
                            marginBottom: 1
                        }}
                    >
                        Share
                    </Button>
            </Paper>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullScreen={false}
            maxWidth="xl"
            PaperProps={{
                sx: {
                    width: '90%',
                    height: '90%',
                    maxWidth: '90%',
                    maxHeight: '90%',
                    margin: 'auto',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: 'background.paper',
                    boxShadow: theme.shadows[24]
                }
            }}
            BackdropProps={{
                sx: {
                    backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }
            }}
        >
            <DialogTitle sx={{ 
                p: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {getFileIcon()}
                    <Typography variant="h6" component="span" noWrap>
                        {file?.filename}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="File Info">
                        <IconButton
                            size="small"
                            onClick={() => setShowInfo(!showInfo)}
                            sx={{
                                color: showInfo ? theme.palette.primary.main : theme.palette.grey[500],
                                '&:hover': {
                                    bgcolor: 'rgba(37, 99, 235, 0.08)',
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            <InfoIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Actions">
                        <IconButton
                            size="small"
                            onClick={() => setShowActions(!showActions)}
                            sx={{
                                color: showActions ? theme.palette.primary.main : theme.palette.grey[500],
                                '&:hover': {
                                    bgcolor: 'rgba(37, 99, 235, 0.08)',
                                    color: theme.palette.primary.main
                                }
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                        <IconButton
                        size="small" 
                            onClick={onClose}
                            sx={{
                                color: theme.palette.grey[500],
                                '&:hover': {
                                    bgcolor: 'rgba(37, 99, 235, 0.08)',
                                color: theme.palette.primary.main
                                }
                            }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ 
                    p: 0,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflow: 'hidden'
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    overflow: 'hidden'
                }}>
                {renderPreview()}
                    {showInfo && renderFileInfo()}
                    {showActions && renderActions()}
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default PreviewModal; 