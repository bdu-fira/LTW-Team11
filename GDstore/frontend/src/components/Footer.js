import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton, Stack, Button } from '@mui/material';
import {
  LocalShipping, Security, HeadsetMic, SettingsBackupRestore,
  YouTube, Facebook, Chat, Apple, Google
} from '@mui/icons-material';

const TRUST_BADGES = [
  { icon: <LocalShipping sx={{ color: '#c62828' }} />, title: 'Giao hàng miễn phí', desc: 'Cho đơn hàng từ 1.000.000đ' },
  { icon: <Security sx={{ color: '#c62828' }} />, title: 'Chính hãng 100%', desc: 'Cam kết nguồn gốc rõ ràng' },
  { icon: <HeadsetMic sx={{ color: '#c62828' }} />, title: 'Hỗ trợ 24/7', desc: 'Giải đáp mọi thắc mắc' },
  { icon: <SettingsBackupRestore sx={{ color: '#c62828' }} />, title: 'Đổi trả 30 ngày', desc: 'Yên tâm khi mua sắm' },
];

const Footer = () => {
  const headerStyle = {
    color: '#c62828',
    fontWeight: 700,
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    mb: 2.5
  };

  const linkStyle = {
    color: '#666',
    fontSize: '0.85rem',
    textDecoration: 'none',
    display: 'block',
    mb: 1.2,
    '&:hover': { color: '#c62828', textDecoration: 'underline' }
  };

  const badgeStyle = {
    bgcolor: '#fff0f0',
    borderRadius: '8px',
    p: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32
  };

  return (
    <Box sx={{ mt: 'auto', borderTop: '1px solid #f0efef' }}>
      {/* ════ TRUST BADGES (KEEPING OLD DESIGN BUT FITTING NEW COLOR) ════ */}
      <Box sx={{ bgcolor: '#b71c1c', py: 4 }}>
        <Container maxWidth="lg" sx={{ px: { xs: 3, md: 2 } }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' }, 
            flexWrap: 'wrap', 
            gap: { xs: 3, md: 4 }, 
            justifyContent: 'center' 
          }}>
            {TRUST_BADGES.map((badge, idx) => (
              <Box key={idx} sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2.5, 
                color: 'white',
                width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(25% - 24px)' }
              }}>
                <Box sx={{ bgcolor: 'white', borderRadius: 2, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {badge.icon}
                </Box>
                <Box>
                  <Typography variant="body1" fontWeight={800}>{badge.title}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>{badge.desc}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ════ MAIN TIKI-STYLE FOOTER ════ */}
      <Box sx={{ bgcolor: '#fffcfc', pt: 8, pb: 4 }}>
        <Container maxWidth="xl">
          <Grid container spacing={4} justifyContent="space-between">

            {/* Column 1: Customer Support */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography sx={headerStyle}>Hỗ trợ khách hàng</Typography>
              <Typography variant="h5" fontWeight={900} color="#1a1a1a" sx={{ mb: 0.5 }}></Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2.5 }}>

              </Typography>
              <Box>
                {['Các câu hỏi thường gặp', 'Gửi yêu cầu hỗ trợ', 'Hướng dẫn đặt hàng', 'Phương thức vận chuyển', 'Chính sách đổi trả', 'Chính sách bảo hành'].map((txt, i) => (
                  <Link key={i} href="#" sx={linkStyle}>{txt}</Link>
                ))}
              </Box>
            </Grid>

            {/* Column 2: Digital Curator */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography sx={headerStyle}>THE DIGITAL CURATOR</Typography>
              <Box>
                {['Về GD Store', 'Chính sách bảo mật', 'Điều khoản dịch vụ'].map((txt, i) => (
                  <Link key={i} href="#" sx={linkStyle}>{txt}</Link>
                ))}
              </Box>
            </Grid>

            {/* Column 3: Partnerships */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography sx={headerStyle}>Hợp tác và liên kết</Typography>
              <Box sx={{ mb: 4 }}>
                {['Bán hàng cùng GD Store', 'Dành cho doanh nghiệp', 'Chương trình đối tác'].map((txt, i) => (
                  <Link key={i} href="#" sx={linkStyle}>{txt}</Link>
                ))}
              </Box>

            </Grid>

            {/* Column 4: Payment Methods */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography sx={headerStyle}>Phương thức thanh toán</Typography>
              <Grid container spacing={1}>
                {['VISA', 'MOMO', 'ZALOPAY', 'ATM'].map((pay, i) => (
                  <Grid item xs={4} key={i}>
                    <Box sx={{
                      bgcolor: 'white', border: '1px solid #f0f0f0', borderRadius: '4px', p: 1,
                      textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}>
                      <Typography variant="caption" fontWeight={800} color="#666" sx={{ fontSize: '0.65rem' }}>{pay}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Column 5: Connect & Apps */}
            <Grid item xs={12} sm={6} md={2.4}>
              <Typography sx={headerStyle}>Kết nối với chúng tôi</Typography>
              <Stack direction="row" spacing={1.5} sx={{ mb: 5 }}>
                {[<Security />, <Chat />].map((icon, i) => (
                  <IconButton key={i} size="small" sx={{
                    bgcolor: '#fff0f0', borderRadius: '8px',
                    '&:hover': { bgcolor: '#ffebeb' }, color: '#c62828'
                  }}>
                    {icon}
                  </IconButton>
                ))}
              </Stack>

              <Typography sx={headerStyle}>Tải ứng dụng trên điện thoại</Typography>
              <Stack direction="column" spacing={1.5}>
                <Button variant="contained" startIcon={<Apple />} sx={{
                  bgcolor: '#1a1a1a', textTransform: 'none', borderRadius: '6px',
                  fontSize: '0.8rem', justifyContent: 'flex-start', py: 0.8
                }}>
                  App Store
                </Button>
                <Button variant="contained" startIcon={<Google />} sx={{
                  bgcolor: '#1a1a1a', textTransform: 'none', borderRadius: '6px',
                  fontSize: '0.8rem', justifyContent: 'flex-start', py: 0.8
                }}>
                  Google Play
                </Button>
              </Stack>
            </Grid>

          </Grid>

          {/* Bottom section */}
          <Box sx={{ mt: 10, pt: 4, borderTop: '1px solid #f0efef', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Website thương mại điện tử GD Store
              </Typography>
              <Typography variant="caption" color="text.secondary">
                © {new Date().getFullYear()} GD Store. Tất cả các quyền được bảo lưu.
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <Link href="#" variant="caption" color="text.secondary" underline="hover">Về GD Store</Link>
              <Link href="#" variant="caption" color="text.secondary" underline="hover">Liên hệ</Link>
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Footer;