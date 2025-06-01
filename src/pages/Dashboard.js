import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Box,
    Alert,
    InputAdornment,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Share as ShareIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Search as SearchIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
    getFiles,
    uploadFile,
    downloadFile,
    deleteFile,
    shareFile,
} from '../services/api';

const Dashboard = () => {
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [shareUserId, setShareUserId] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }
        loadFiles();
    }, [user, navigate]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredFiles(files);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = files.filter(file => 
                file.filename.toLowerCase().includes(query) ||
                file.file_type.toLowerCase().includes(query)
            );
            setFilteredFiles(filtered);
        }
    }, [searchQuery, files]);

    const loadFiles = async () => {
        try {
            const data = await getFiles();
            setFiles(data);
            setFilteredFiles(data);
        } catch (err) {
            setError('Failed to load files');
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            await uploadFile(file);
            setUploadOpen(false);
            loadFiles();
        } catch (err) {
            setError('Failed to upload file');
        }
    };

    const handleDownload = async (fileId, filename) => {
        try {
            const blob = await downloadFile(fileId);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('Failed to download file');
        }
    };

    const handleDelete = async (fileId) => {
        if (!window.confirm('Are you sure you want to delete this file?')) return;

        try {
            await deleteFile(fileId);
            loadFiles();
        } catch (err) {
            setError('Failed to delete file');
        }
    };

    const handleShare = async () => {
        if (!selectedFile || !shareUserId) return;

        try {
            await shareFile(selectedFile.id, parseInt(shareUserId));
            setShareOpen(false);
            setShareUserId('');
            setSelectedFile(null);
        } catch (err) {
            setError('Failed to share file');
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <Container maxWidth="lg">
            <Box sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="h4">My Files</Typography>
                    <Box>
                        <Button
                            variant="contained"
                            startIcon={<UploadIcon />}
                            onClick={() => setUploadOpen(true)}
                            sx={{ mr: 2 }}
                        >
                            Upload
                        </Button>
                        <Button variant="outlined" color="error" onClick={logout}>
                            Logout
                        </Button>
                    </Box>
                </Box>

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

                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Filename</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Size</TableCell>
                                <TableCell>Upload Date</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredFiles.map((file) => (
                                <TableRow key={file.id}>
                                    <TableCell>{file.filename}</TableCell>
                                    <TableCell>{file.file_type}</TableCell>
                                    <TableCell>{formatFileSize(file.file_size)}</TableCell>
                                    <TableCell>
                                        {new Date(file.upload_date).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <IconButton
                                            color="primary"
                                            onClick={() => handleDownload(file.id, file.filename)}
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                        <IconButton
                                            color="info"
                                            onClick={() => {
                                                setSelectedFile(file);
                                                setShareOpen(true);
                                            }}
                                        >
                                            <ShareIcon />
                                        </IconButton>
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDelete(file.id)}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Upload Dialog */}
            <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)}>
                <DialogTitle>Upload File</DialogTitle>
                <DialogContent>
                    <input
                        type="file"
                        onChange={handleUpload}
                        style={{ marginTop: '1rem' }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
                <DialogTitle>Share File</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="User ID"
                        type="number"
                        value={shareUserId}
                        onChange={(e) => setShareUserId(e.target.value)}
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShareOpen(false)}>Cancel</Button>
                    <Button onClick={handleShare} variant="contained">
                        Share
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Dashboard; 