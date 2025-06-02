import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Container, Paper, TextField, Button, Alert, Snackbar, CircularProgress, Divider } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://mydrive-backend-oi3r.onrender.com';

function Profile() {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState('');
  const [editedUsername, setEditedUsername] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [passwordChange, setPasswordChange] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passwordChangeError, setPasswordChangeError] = useState('');
  const [passwordChangeSnackbar, setPasswordChangeSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { token } = useAuth(); // Removed unused 'user'

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(response.data);
      setEditedEmail(response.data.email);
      setEditedUsername(response.data.username);
    } catch (err) {
      setError('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, fetchUserProfile]); // Added token and fetchUserProfile to dependencies

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    // Reset edited fields if canceling edit
    if (isEditing && userProfile) {
      setEditedEmail(userProfile.email);
      setEditedUsername(userProfile.username);
    }
  };

  const handleProfileUpdate = async () => {
    if (!editedEmail.trim() || !editedUsername.trim()) {
      setSnackbar({ open: true, message: 'Email and Username cannot be empty.', severity: 'warning' });
      return;
    }

    if (userProfile && editedEmail === userProfile.email && editedUsername === userProfile.username) {
      setSnackbar({ open: true, message: 'No changes detected.', severity: 'info' });
      setIsEditing(false);
      return;
    }

    try {
      const updateData = {};
      if (userProfile && editedEmail !== userProfile.email) {
        updateData.email = editedEmail;
      }
      if (userProfile && editedUsername !== userProfile.username) {
        updateData.username = editedUsername;
      }

      const response = await axios.patch(`${API_URL}/users/me`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserProfile(response.data);
      setIsEditing(false);
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (err) {
      let errorMessage = 'Failed to update profile';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = `Failed to update profile: ${err.response.data.detail}`;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

   const handlePasswordChange = async () => {
    if (!passwordChange.current_password || !passwordChange.new_password || !passwordChange.confirm_password) {
      setPasswordChangeError('All password fields are required.');
      return;
    }
    if (passwordChange.new_password !== passwordChange.confirm_password) {
      setPasswordChangeError('New password and confirm password do not match.');
      return;
    }
     if (passwordChange.new_password.length < 6) {
        setPasswordChangeError('New password must be at least 6 characters long.');
        return;
    }
    setPasswordChangeError('');

    try {
      await axios.patch(`${API_URL}/users/me/password`, 
        { current_password: passwordChange.current_password, new_password: passwordChange.new_password },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPasswordChange({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordChangeSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
    } catch (err) {
       let errorMessage = 'Failed to update password';
       if (err.response && err.response.data && err.response.data.detail) {
        errorMessage = `Failed to update password: ${err.response.data.detail}`;
      } else if (err.message) {
         errorMessage = `Failed to update password: ${err.message}`;
      }
      setPasswordChangeError(errorMessage);
    }
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="md">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
     return (
      <Container component="main" maxWidth="md">
        <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
           <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
     );
  }

  return (
    <Container component="main" maxWidth="md">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography variant="h4" gutterBottom>User Profile</Typography>

          {userProfile && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Profile Information</Typography>
              
              <TextField
                label="Username"
                value={isEditing ? editedUsername : userProfile.username}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isEditing }}
                onChange={(e) => setEditedUsername(e.target.value)}
              />
              <TextField
                label="Email"
                value={isEditing ? editedEmail : userProfile.email}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: !isEditing }}
                onChange={(e) => setEditedEmail(e.target.value)}
              />

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                {isEditing ? (
                  <>
                    <Button variant="contained" onClick={handleProfileUpdate}>Save Changes</Button>
                    <Button variant="outlined" onClick={handleEditToggle}>Cancel</Button>
                  </>
                ) : (
                  <Button variant="outlined" onClick={handleEditToggle}>Edit Profile</Button>
                )}
              </Box>
            </Box>
          )}

          <Divider sx={{ my: 4 }} />

          <Box>
             <Typography variant="h6">Change Password</Typography>
             {passwordChangeError && ( <Alert severity="error" sx={{ mt: 2 }}>{passwordChangeError}</Alert> )}
             <TextField
                label="Current Password"
                type="password"
                fullWidth
                margin="normal"
                value={passwordChange.current_password}
                onChange={(e) => setPasswordChange({ ...passwordChange, current_password: e.target.value })}
             />
             <TextField
                label="New Password"
                type="password"
                fullWidth
                margin="normal"
                value={passwordChange.new_password}
                onChange={(e) => setPasswordChange({ ...passwordChange, new_password: e.target.value })}
             />
             <TextField
                label="Confirm New Password"
                type="password"
                fullWidth
                margin="normal"
                value={passwordChange.confirm_password}
                onChange={(e) => setPasswordChange({ ...passwordChange, confirm_password: e.target.value })}
             />
             <Button variant="contained" sx={{ mt: 2 }} onClick={handlePasswordChange}>Change Password</Button>
          </Box>

        </Paper>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
       <Snackbar
        open={passwordChangeSnackbar.open}
        autoHideDuration={6000}
        onClose={() => setPasswordChangeSnackbar({ ...passwordChangeSnackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setPasswordChangeSnackbar({ ...passwordChangeSnackbar, open: false })}
          severity={passwordChangeSnackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 1,
            boxShadow: 2
          }}
        >
          {passwordChangeSnackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Profile; 