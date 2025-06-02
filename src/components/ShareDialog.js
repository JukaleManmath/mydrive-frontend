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
            console.log('Sharing file with:', email, 'Permission:', permission);
            await onSubmit(email, permission);
            handleClose();
        } catch (err) {
            console.error('Share error:', err);
            setError(err.message || (err.response?.data?.detail) || 'Failed to share file');
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Share "{fileName}"</DialogTitle>
                <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            label="Email Address"
                            value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        margin="normal"
                        required
                            error={!!error}
                        />
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Permission</InputLabel>
                        <Select
                            value={permission}
                            onChange={(e) => setPermission(e.target.value)}
                            label="Permission"
                        >
                            <MenuItem value="read">Read Only</MenuItem>
                            <MenuItem value="edit">Can Edit</MenuItem>
                        </Select>
                    </FormControl>
                    </Box>
                </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                    onClick={handleSubmit}
                        variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                    >
                        Share
                    </Button>
                </DialogActions>
        </Dialog>
    );
}; 