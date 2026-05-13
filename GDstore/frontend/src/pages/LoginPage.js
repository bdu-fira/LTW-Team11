import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Alert, InputAdornment, IconButton, Checkbox, FormControlLabel } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import loginImage from './images/login-bg.png';

const LoginPage = () => {
  const [email, setEmail] = useState(() => localStorage.getItem('gd_remembered_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(() => !!localStorage.getItem('gd_remembered_email'));
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  useEffect(() => {
    if (!remember) localStorage.removeItem('gd_remembered_email');
  }, [remember]);

  const lineInputSx = {
    '& .MuiInputBase-root': {
      borderRadius: 0,
      fontSize: '0.95rem',
      '&:before': { borderBottomColor: '#d9d9d9' },
      '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#b71926' },
      '&:after': { borderBottomColor: '#b71926' },
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrorCode('');
    const result = await login(email, password, remember);
    if (result.success) {
      if (remember) localStorage.setItem('gd_remembered_email', email);
      else localStorage.removeItem('gd_remembered_email');
      navigate('/');
    } else {
      setError(result.error);
      setErrorCode(result.errorCode || '');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    setError('');
    const result = await loginWithGoogle(credentialResponse.credential);
    if (result.success) navigate('/');
    else setError(result.error || 'Đăng nhập Google thất bại');
    setGoogleLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7e9eb', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
      <Box sx={{ width: '100%', maxWidth: 1120, minHeight: { xs: 'auto', md: 700 }, borderRadius: 3, overflow: 'hidden', boxShadow: '0 18px 45px rgba(70,20,30,0.18)', bgcolor: '#fff', display: 'flex' }}>
        <Box sx={{ flex: { xs: 0, md: 1.1 }, display: { xs: 'none', md: 'block' }, backgroundImage: `url(${loginImage})`, backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', position: 'relative' }}>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 3, md: 8 }, py: { xs: 4, md: 0 } }}>
          <Box sx={{ width: '100%', maxWidth: 410 }}>
            <Typography sx={{ color: '#980e1e', fontWeight: 800, fontStyle: 'italic', fontSize: 21, mb: 2 }}>GD Store</Typography>
            <Typography sx={{ fontSize: 19, fontWeight: 700, color: '#1c1c1c', mb: 0.5 }}>Chào mừng trở lại!</Typography>
            <Typography sx={{ color: '#8f8f8f', fontSize: 14, mb: 3.5 }}>Vui lòng nhập thông tin để truy cập vào tài khoản của bạn.</Typography>
            {error && !errorCode && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
            <Box component="form" onSubmit={handleSubmit}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, mb: 1, color: '#393939' }}>ĐỊA CHỈ EMAIL</Typography>
              <TextField fullWidth required variant="standard" placeholder="example@luxe.com" value={email} onChange={(e) => { setEmail(e.target.value); if (errorCode === 'USER_NOT_FOUND') { setError(''); setErrorCode(''); } }} error={errorCode === 'USER_NOT_FOUND'} helperText={errorCode === 'USER_NOT_FOUND' ? error : ''} sx={{ ...lineInputSx, mb: 3 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#393939' }}>MẬT KHẨU</Typography>
                <Typography sx={{ color: '#8f1b27', fontSize: 13, fontWeight: 600 }}>Quên mật khẩu?</Typography>
              </Box>
              <TextField fullWidth required variant="standard" type={showPassword ? 'text' : 'password'} placeholder="........" value={password} onChange={(e) => { setPassword(e.target.value); if (errorCode === 'WRONG_PASSWORD') { setError(''); setErrorCode(''); } }} error={errorCode === 'WRONG_PASSWORD'} helperText={errorCode === 'WRONG_PASSWORD' ? error : ''} InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">{showPassword ? <VisibilityOff sx={{ fontSize: 18, color: '#8f8f8f' }} /> : <Visibility sx={{ fontSize: 18, color: '#8f8f8f' }} />}</IconButton></InputAdornment> }} sx={{ ...lineInputSx, mb: 2.5 }} />
              <FormControlLabel sx={{ mb: 2.5 }} control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" sx={{ color: '#c7c7c7', '&.Mui-checked': { color: '#b71926' } }} />} label={<Typography sx={{ fontSize: 14, color: '#4e4e4e' }}>Ghi nhớ đăng nhập</Typography>} />
              <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ bgcolor: '#b30016', py: 1.45, borderRadius: 1, fontWeight: 700, letterSpacing: 1.2, mb: 2.8, '&:hover': { bgcolor: '#8f0011' } }}>{loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}</Button>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.8 }}>
                <Box sx={{ flex: 1, height: 1, bgcolor: '#e5e5e5' }} />
                <Typography sx={{ px: 2, color: '#9b9b9b', fontSize: 12, letterSpacing: 1 }}>HOẶC</Typography>
                <Box sx={{ flex: 1, height: 1, bgcolor: '#e5e5e5' }} />
              </Box>
              <Box sx={{ mb: 2.8, minHeight: 40 }}>
                {googleLoading ? <Button fullWidth variant="outlined" disabled>Đang xử lý...</Button> : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Đăng nhập Google bị hủy hoặc thất bại.')} theme="outline" size="large" width="100%" text="signin_with" locale="vi" shape="rectangular" />}
              </Box>
              <Typography sx={{ textAlign: 'center', fontSize: 14, color: '#8a8a8a' }}>
                Chưa có tài khoản? <RouterLink to="/register" style={{ color: '#8f1b27', fontWeight: 700, textDecoration: 'none' }}>Đăng ký ngay</RouterLink>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
