import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    useTheme,
    Alert,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress
} from '@mui/material';

export const ShareDialog = ({ open, onClose, onSubmit, fileName }) => {
    const theme = useTheme();
    const [email, setEmail] = useState('');
    const [permission, setPermission] = useState('read');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Please enter an email address');
            return;
        }
        if (!email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }

        try {
            setLoading(true);
            setError('');
            await onSubmit(email, permission);
            handleClose();
        } catch (err) {
            console.error('Share error:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to share file');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setEmail('');
        setPermission('read');
        setError('');
        onClose();
    };

    return (
        <Dialog 
            open={open} 
            onClose={handleClose} 
            maxWidth="sm" 
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
                Share "{fileName}"
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
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                        error={!!error}
                        disabled={loading}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 1
                            }
                        }}
                    />
                    <FormControl 
                        fullWidth 
                        margin="normal"
                        disabled={loading}
                    >
                        <InputLabel>Permission</InputLabel>
                        <Select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                            label="Permission"
                            sx={{
                                borderRadius: 1
                            }}
                        >
                            <MenuItem value="read">Read Only</MenuItem>
                            <MenuItem value="edit">Can Edit</MenuItem>
                        </Select>
                    </FormControl>
                </Box>
            </DialogContent>
            <DialogActions sx={{ 
                px: 3, 
                pb: 3,
                borderTop: `1px solid ${theme.palette.divider}`,
                pt: 2
            }}>
                <Button 
                    onClick={handleClose} 
                    disabled={loading}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 1
                    }}
                >
                    Cancel
                </Button>
                <Button 
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    sx={{ 
                        textTransform: 'none',
                        borderRadius: 1
                    }}
                >
                    Share
                </Button>
            </DialogActions>
        </Dialog>
    );
}; 