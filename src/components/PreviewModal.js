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

    const getFileIcon = () => {
        if (!file) return <FileIcon />;
        
        const fileType = file.file_type?.toLowerCase() || '';
        if (fileType.startsWith('image/')) return <ImageIcon />;
        if (fileType === 'application/pdf') return <PdfIcon />;
        if (fileType.startsWith('text/')) return <TextIcon />;
        return <FileIcon />;
    };

    const handleDownload = async () => {
        if (!file) return;
        
        setDownloading(true);
        try {
            await downloadFile(file.id);
        } catch (err) {
            console.error('Error downloading file:', err);
            setError(err.message);
        } finally {
            setDownloading(false);
        }
    };

    const renderPreview = () => {
        console.log('Rendering preview with:', {
            loading,
            error,
            file,
            previewUrl,
            previewContent,
            fileType: file?.file_type?.toLowerCase()
        });

        if (loading) {
            return (
                <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    minHeight="calc(100vh - 64px)"
                    bgcolor="background.default"
                >
                    <CircularProgress size={60} sx={{ color: theme.palette.primary.main }} />
                </Box>
            );
        }

        if (error) {
            return (
                <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    minHeight="calc(100vh - 64px)"
                    bgcolor="background.default"
                >
                    <Alert 
                        severity="error" 
                        sx={{ 
                            maxWidth: '80%',
                            p: 3,
                            borderRadius: 0,
                            bgcolor: 'rgba(239, 68, 68, 0.1)',
                            color: theme.palette.error.main,
                            '& .MuiAlert-icon': {
                                color: theme.palette.error.main
                            }
                        }}
                    >
                        {error}
                    </Alert>
                </Box>
            );
        }

        if (!file) {
            return (
                <Box 
                    display="flex" 
                    justifyContent="center" 
                    alignItems="center" 
                    minHeight="calc(100vh - 64px)"
                    bgcolor="background.default"
                >
                    <Typography variant="h6" color="text.secondary">
                        No file selected
                    </Typography>
                </Box>
            );
        }

        const fileType = file.file_type?.toLowerCase() || '';
        console.log('Rendering preview for file type:', fileType);

        // Handle text content
        if (previewContent) {
            console.log('Rendering text content preview');
            return (
                <Box
                    sx={{
                        height: 'calc(100vh - 64px)',
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: 'background.default',
                        p: 3,
                        overflow: 'auto'
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            width: '100%',
                            height: '100%',
                            p: 3,
                            bgcolor: 'background.paper',
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            fontFamily: 'monospace'
                        }}
                    >
                        <Typography component="pre" sx={{ m: 0 }}>
                            {previewContent}
                        </Typography>
                    </Paper>
                </Box>
            );
        }

        // Handle binary files (images and PDFs)
        if (previewUrl) {
            console.log('Rendering binary file preview with URL:', previewUrl);
            if (fileType === 'application/pdf') {
                return (
                    <Box
                        sx={{
                            height: 'calc(100vh - 64px)',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            bgcolor: 'background.default',
                            p: 0
                        }}
                    >
                        <object
                            data={previewUrl}
                            type="application/pdf"
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                borderRadius: 0,
                                boxShadow: 'none',
                                backgroundColor: theme.palette.background.paper
                            }}
                        >
                            <Box
                                sx={{
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 3
                                }}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    Unable to display PDF
                                </Typography>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => window.open(previewUrl, '_blank')}
                                    startIcon={<PdfIcon />}
                                >
                                    Open PDF in New Tab
                                </Button>
                            </Box>
                        </object>
                    </Box>
                );
            } else if (fileType.startsWith('image/')) {
                return (
                    <Box
                        sx={{
                            height: 'calc(100vh - 64px)',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'background.default',
                            p: 0
                        }}
                    >
                        <img
                            src={previewUrl}
                            alt={file.filename}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                objectFit: 'contain',
                                borderRadius: 0,
                                boxShadow: 'none'
                            }}
                            onError={(e) => {
                                console.error('Error loading image:', e);
                                setError('Failed to load image preview');
                            }}
                        />
                    </Box>
                );
            } else if (fileType.startsWith('text/') || fileType.includes('javascript') || fileType.includes('json') || fileType.includes('xml') || fileType.includes('python') || fileType.includes('java') || fileType.includes('c++') || fileType.includes('c') || fileType.includes('php') || fileType.includes('ruby') || fileType.includes('swift')) {
                return (
                    <Box
                        sx={{
                            height: 'calc(100vh - 64px)',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            bgcolor: 'background.default',
                            p: 3,
                            overflow: 'auto'
                        }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                width: '100%',
                                height: '100%',
                                p: 3,
                                bgcolor: 'background.paper',
                                overflow: 'auto',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'monospace'
                            }}
                        >
                            <Typography component="pre" sx={{ m: 0 }}>
                                {previewContent}
                            </Typography>
                        </Paper>
                    </Box>
                );
            }
        }

        console.log('No preview available for file type:', fileType);
        return (
            <Box 
                display="flex" 
                justifyContent="center" 
                alignItems="center" 
                minHeight="calc(100vh - 64px)"
                bgcolor="background.default"
            >
                <Typography variant="h6" color="text.secondary">
                    Preview not available for this file type
                </Typography>
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
                        <span style={{ color: theme.palette.text.primary }}>{file.filename}</span>
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