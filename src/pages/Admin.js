import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Box,
    Alert,
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({
        username: '',
        email: '',
    });
    const [successMessage, setSuccessMessage] = useState('');

    const { token } = useAuth();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:8000/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users');
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditForm({
            username: user.username,
            email: user.email,
        });
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveEdit = async () => {
        try {
            await axios.patch(
                `http://localhost:8000/admin/users/${editingUser.id}`,
                {
                    username: editForm.username,
                    email: editForm.email,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setSuccessMessage('User updated successfully');
            setEditingUser(null);
            fetchUsers(); // Refresh the user list
        } catch (err) {
            setError('Failed to update user');
        }
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditForm({ username: '', email: '' });
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await axios.delete(`http://localhost:8000/admin/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setSuccessMessage('User deleted successfully');
                fetchUsers(); // Refresh the user list
            } catch (err) {
                setError('Failed to delete user');
            }
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Admin Dashboard
            </Typography>
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Username</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Admin Status</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>
                                        {editingUser?.id === user.id ? (
                                            <TextField
                                                name="username"
                                                value={editForm.username}
                                                onChange={handleEditChange}
                                                size="small"
                                            />
                                        ) : (
                                            user.username
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {editingUser?.id === user.id ? (
                                            <TextField
                                                name="email"
                                                value={editForm.email}
                                                onChange={handleEditChange}
                                                size="small"
                                            />
                                        ) : (
                                            user.email
                                        )}
                                    </TableCell>
                                    <TableCell>{user.is_admin ? 'Yes' : 'No'}</TableCell>
                                    <TableCell>
                                        {editingUser?.id === user.id ? (
                                            <Box>
                                                <IconButton onClick={handleSaveEdit} color="primary">
                                                    <SaveIcon />
                                                </IconButton>
                                                <IconButton onClick={handleCancelEdit} color="error">
                                                    <CancelIcon />
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Box>
                                                <IconButton onClick={() => handleEditClick(user)} color="primary">
                                                    <EditIcon />
                                                </IconButton>
                                                <IconButton onClick={() => handleDeleteUser(user.id)} color="error">
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Container>
    );
};

export default Admin; 