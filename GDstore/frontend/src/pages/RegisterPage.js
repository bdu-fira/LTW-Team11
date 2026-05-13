import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Alert,
  InputAdornment, Checkbox, FormControlLabel, Grid, Divider
} from '@mui/material';
import { Person, Email, Lock, ConfirmationNumber, Stars, NotificationsActive, CardGiftcard } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import registerBg from './images/register-bg.png';

const lineInputSx = {
  '& .MuiInputBase-root': {
    borderRadius: 0,
    fontSize: '0.95rem',
    '&:before': { borderBottomColor: '#d9d9d9' },
    '&:hover:not(.Mui-disabled):before': { borderBottomColor: '#b71926' },
    '&:after': { borderBottomColor: '#b71926' },
  }
};

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '', contact: '', password: '', confirmPassword: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { register } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    if (formData.password.length < 6) { setError('Mật khẩu phải có ít nhất 6 ký tự'); return; }
    if (!agreed) { setError('Vui lòng đồng ý với điều khoản dịch vụ'); return; }

    setLoading(true);
    const isEmail = formData.contact.includes('@');
    const emailToSubmit = isEmail ? formData.contact : `${formData.contact}@phone.vn`;
    const phoneToSubmit = isEmail ? '' : formData.contact;

    const result = await register(formData.name, emailToSubmit, formData.password, phoneToSubmit);
    if (result.success) {
      setSuccess('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  const LabelText = ({ children }) => (
    <Typography sx={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, mb: 1, color: '#393939' }}>
      {children}
    </Typography>
  );

  const perks = [
    { icon: <ConfirmationNumber sx={{ fontSize: 18 }} />, title: 'Voucher Chào Mừng', desc: 'Nhận ngay ưu đãi 15% cho đơn hàng đầu tiên.' },
    { icon: <Stars sx={{ fontSize: 18 }} />, title: 'Tích Điểm Thân Thiết', desc: 'Mọi chi tiêu đều được quy đổi thành điểm thưởng.' },
    { icon: <NotificationsActive sx={{ fontSize: 18 }} />, title: 'Flash Sale Exclusive', desc: 'Thông báo sớm nhất về các chương trình giảm giá.' },
    { icon: <CardGiftcard sx={{ fontSize: 18 }} />, title: 'Quà Tặng Sinh Nhật', desc: 'Ưu đãi bất ngờ trong tháng sinh nhật của bạn.' },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f7e9eb', display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 2, md: 4 } }}>
      <Box sx={{ width: '100%', maxWidth: 1120, minHeight: { xs: 'auto', md: 700 }, borderRadius: 2, overflow: 'hidden', boxShadow: '0 18px 45px rgba(70,20,30,0.18)', bgcolor: '#fff', display: 'flex' }}>
      <Box
        sx={{
          flex: { xs: 0, md: 1.1 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundImage: `linear-gradient(140deg, rgba(10,10,10,0.4), rgba(28,12,12,0.25)), url(${registerBg})`,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          position: 'relative',
          p: { md: 6 }
        }}
      >
        <Box sx={{ 
          color: 'white', 
          zIndex: 1, 
          bgcolor: 'rgba(12, 6, 6, 0.45)', 
          backdropFilter: 'blur(12px)', 
          p: 4.5, 
          borderRadius: 4, 
          boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Typography sx={{ fontSize: 36, fontWeight: 700, mb: 1.5, textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>Đặc quyền thành viên</Typography>
          <Typography sx={{ opacity: 0.95, fontSize: 15, maxWidth: 380, mb: 4.5, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
            Khám phá ưu đãi độc quyền dành riêng cho tài khoản GD Store.
          </Typography>
          {perks.map((perk) => (
            <Box key={perk.title} sx={{ display: 'flex', gap: 1.8, mb: 2.5 }}>
              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'rgba(179,0,22,0.6)', color: '#ffd6db', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                {perk.icon}
              </Box>
              <Box>
                <Typography sx={{ fontSize: 19, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{perk.title}</Typography>
                <Typography sx={{ fontSize: 13.5, opacity: 0.85, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>{perk.desc}</Typography>
              </Box>
            </Box>
          ))}
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)', mt: 4, mb: 2.5 }} />
          <Typography sx={{ fontSize: 12, letterSpacing: 1.5, opacity: 0.8, textShadow: '0 1px 3px rgba(0,0,0,0.5)', fontWeight: 600 }}>THE ART OF LIVING - GD STORE</Typography>
        </Box>
      </Box>

      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', px: { xs: 3, md: 8 }, py: { xs: 4, md: 0 } }}>
        <Box sx={{ width: '100%', maxWidth: 430 }}>
          <Typography sx={{ color: '#980e1e', fontWeight: 800, fontStyle: 'italic', fontSize: 21, mb: 2 }}>
            GD Store
          </Typography>
          <Typography sx={{ fontSize: 19, fontWeight: 700, color: '#1c1c1c', mb: 0.5 }}>
            Tạo tài khoản mới
          </Typography>
          <Typography sx={{ color: '#8f8f8f', fontSize: 14, mb: 3.5 }}>
            Điền thông tin để bắt đầu trải nghiệm mua sắm cùng GD Store.
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <LabelText>HỌ VÀ TÊN</LabelText>
            <TextField
              fullWidth
              required
              variant="standard"
              name="name"
              placeholder="Nguyễn Văn A"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment> }}
              sx={{ ...lineInputSx, mb: 2.8 }}
            />

            <LabelText>EMAIL HOẶC SỐ ĐIỆN THOẠI</LabelText>
            <TextField
              fullWidth
              required
              variant="standard"
              name="contact"
              placeholder="example@gmail.com"
              value={formData.contact}
              onChange={handleChange}
              disabled={loading}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment> }}
              sx={{ ...lineInputSx, mb: 2.8 }}
            />

            <Grid container spacing={2} sx={{ mb: 2.3 }}>
              <Grid item xs={12} sm={6}>
                <LabelText>MẬT KHẨU</LabelText>
                <TextField
                  fullWidth
                  required
                  variant="standard"
                  name="password"
                  type="password"
                  placeholder="........"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment> }}
                  sx={lineInputSx}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <LabelText>XÁC NHẬN</LabelText>
                <TextField
                  fullWidth
                  required
                  variant="standard"
                  name="confirmPassword"
                  type="password"
                  placeholder="........"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#aaa', fontSize: 18 }} /></InputAdornment> }}
                  sx={lineInputSx}
                />
              </Grid>
            </Grid>

            <FormControlLabel
              sx={{ mb: 2.6, alignItems: 'flex-start' }}
              control={
                <Checkbox
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  size="small"
                  sx={{ color: '#c7c7c7', '&.Mui-checked': { color: '#b71926' } }}
                />
              }
              label={<Typography sx={{ fontSize: 13.5, color: '#4e4e4e' }}>Tôi đồng ý với điều khoản dịch vụ và chính sách bảo mật.</Typography>}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#b30016',
                py: 1.45,
                borderRadius: 1,
                fontWeight: 700,
                letterSpacing: 1.1,
                mb: 2.8,
                '&:hover': { bgcolor: '#8f0011' }
              }}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}
            </Button>

            <Typography sx={{ textAlign: 'center', fontSize: 14, color: '#8a8a8a' }}>
              Đã có tài khoản?{' '}
              <RouterLink to="/login" style={{ color: '#8f1b27', fontWeight: 700, textDecoration: 'none' }}>
                Đăng nhập ngay
              </RouterLink>
            </Typography>
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  );
};

export default RegisterPage;
