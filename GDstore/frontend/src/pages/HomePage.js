import React, { useState, useEffect, useRef } from 'react';
import {
  Container, Grid, Card, CardMedia, CardContent, Typography,
  Button, Box, Chip, IconButton
} from '@mui/material';
import {
  ArrowForward, ArrowBackIosNew, ArrowForwardIos, ArrowOutward
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getFirstImage } from '../utils/imageUtils';

// Inject banner animations globally
const BANNER_STYLE = `
  @keyframes kenBurns {
    0%   { transform: scale(1.08) translateX(0px); }
    50%  { transform: scale(1.13) translateX(-8px); }
    100% { transform: scale(1.08) translateX(0px); }
  }
  @keyframes slideUpFade {
    0%   { opacity: 0; transform: translateY(32px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInLeft {
    0%   { opacity: 0; transform: translateX(-24px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  @keyframes dotPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(176,22,30,0.55); }
    50%       { box-shadow: 0 0 0 6px rgba(176,22,30,0); }
  }
  @keyframes shimmerBar {
    0%   { width: 0%; }
    100% { width: 100%; }
  }
  .banner-img { animation: kenBurns 8s ease-in-out infinite; }
  .banner-title { animation: slideUpFade 0.65s cubic-bezier(0.22,1,0.36,1) both; }
  .banner-sub   { animation: slideUpFade 0.65s 0.12s cubic-bezier(0.22,1,0.36,1) both; }
  .banner-btns  { animation: slideUpFade 0.65s 0.24s cubic-bezier(0.22,1,0.36,1) both; }
  .banner-badge { animation: fadeInLeft 0.5s cubic-bezier(0.22,1,0.36,1) both; }
`;

const CATEGORIES = [
  { id: 'phong-khach', name: 'Phòng khách', image: 'https://noithatmyan.vn/wp-content/uploads/2025/03/thiet-ke-noi-that-phong-khach-go-mdf-dep-hien-dai-dang-cap-02.jpg' },
  { id: 'nha-bep', name: 'Nhà bếp', image: 'https://media.noithatcaco.vn/media/api/images/02-2025/phong-bep-ket-hop-phong-2025-3.jpg' },
  { id: 'dien-tu', name: 'Điện tử', image: 'https://daiviet.biz/wp-content/uploads/2025/09/thiet-bi-dien-tu.jpeg' },
  { id: 'phong-ngu', name: 'Phòng ngủ', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80' },
];

const BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1800&q=80',
    badge: '🛋️ Nội thất cao cấp',
    title: 'Tinh tế trong từng không gian',
    sub: 'Khám phá bộ sưu tập nội thất chọn lọc, mang đến phong cách sống hiện đại và đẳng cấp.',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1800&q=80',
    badge: '✨ Phong cách tối giản',
    title: 'Không gian sống đẳng cấp',
    sub: 'Thiết kế tối giản, vật liệu bền vững — tạo nên ngôi nhà trong mơ của bạn.',
  },
  {
    id: 3,
    image: 'https://thietkenhadepmoi.com/wp-content/uploads/2023/01/phong-bep-dep-trang-tri-nha-bep-2024-769x500.jpg',
    badge: '🍳 Bếp hiện đại',
    title: 'Bếp đẹp, cuộc sống vui',
    sub: 'Nội thất nhà bếp thông minh, tiện nghi — biến góc bếp thành trái tim của gia đình.',
  },
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerKey, setBannerKey] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  // Inject style once
  useEffect(() => {
    if (!document.getElementById('gd-banner-style')) {
      const tag = document.createElement('style');
      tag.id = 'gd-banner-style';
      tag.textContent = BANNER_STYLE;
      document.head.appendChild(tag);
    }
  }, []);

  const autoScrollInterval = useRef(null);
  const flashSaleContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  const startAutoScroll = () => {
    // Always clear existing interval first to avoid duplicates
    if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
    autoScrollInterval.current = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
      setBannerKey((k) => k + 1);
      setProgressKey((k) => k + 1);
    }, 5000);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
  };

  const handlePrevBanner = () => {
    stopAutoScroll();
    setCurrentBannerIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
    setBannerKey((k) => k + 1);
    setProgressKey((k) => k + 1);
    startAutoScroll();
  };

  const handleNextBanner = () => {
    stopAutoScroll();
    setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
    setBannerKey((k) => k + 1);
    setProgressKey((k) => k + 1);
    startAutoScroll();
  };

  const scrollFlashSale = (direction) => {
    if (!flashSaleContainerRef.current) return;
    const amount = 300;
    flashSaleContainerRef.current.scrollTo({
      left: flashSaleContainerRef.current.scrollLeft + (direction === 'left' ? -amount : amount),
      behavior: 'smooth'
    });
  };

  const fetchData = async () => {
    try {
      const res = await API.get('/products');
      const resFlash = await API.get('/products?flashSale=true');
      setFeaturedProducts((res.data.products || []).slice(0, 10));
      setFlashSaleProducts((resFlash.data.products || []).slice(0, 10));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentBanner = BANNERS[currentBannerIndex];
  const [realSeconds, setRealSeconds] = useState(2 * 3600 + 45 * 60 + 12);
  useEffect(() => {
    const id = setInterval(() => setRealSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  const rh = String(Math.floor(realSeconds / 3600)).padStart(2, '0');
  const rm = String(Math.floor((realSeconds % 3600) / 60)).padStart(2, '0');
  const rs = String(realSeconds % 60).padStart(2, '0');

  return (
    <Box sx={{ bgcolor: '#faf7f5', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>

        {/* ── BANNER ── */}
        <Box
          sx={{ position: 'relative', borderRadius: 5, overflow: 'hidden', mb: 7 }}
          onMouseEnter={() => { setIsHovered(true); stopAutoScroll(); }}
          onMouseLeave={() => { setIsHovered(false); startAutoScroll(); }}
        >
          {/* Background image with Ken Burns */}
          <Box
            key={`bg-${bannerKey}`}
            sx={{
              position: 'absolute', inset: 0,
              backgroundImage: `url('${currentBanner.image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              animation: 'kenBurns 8s ease-in-out infinite',
              willChange: 'transform',
            }}
          />

          {/* Gradient overlay */}
          <Box sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(100deg, rgba(8,8,8,0.72) 0%, rgba(8,8,8,0.22) 60%, transparent 100%)',
            transition: 'background 0.5s',
          }} />

          {/* Content */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              height: { xs: 320, sm: 430, md: 520 },
              display: 'flex',
              alignItems: 'flex-end',
              p: { xs: 3, md: 6 },
            }}
          >
            <Box key={`text-${bannerKey}`} sx={{ maxWidth: 560, color: '#fff' }}>
              {/* Badge */}
              <Box
                className="banner-badge"
                sx={{
                  display: 'inline-block',
                  bgcolor: 'rgba(176,22,30,0.88)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: 999,
                  px: 2, py: 0.4,
                  fontSize: 12, fontWeight: 700,
                  letterSpacing: 0.5,
                  mb: 1.5,
                  border: '1px solid rgba(255,255,255,0.18)',
                }}
              >
                {currentBanner.badge}
              </Box>

              {/* Title */}
              <Typography
                className="banner-title"
                sx={{ fontSize: { xs: 26, md: 48 }, fontWeight: 800, lineHeight: 1.08, mb: 1.5,
                  textShadow: '0 2px 18px rgba(0,0,0,0.35)' }}
              >
                {currentBanner.title}
              </Typography>

              {/* Sub */}
              <Typography
                className="banner-sub"
                sx={{ opacity: 0.88, fontSize: { xs: 13, md: 15 }, mb: 3,
                  textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}
              >
                {currentBanner.sub}
              </Typography>

              {/* Buttons */}
              <Box className="banner-btns" sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/products')}
                  sx={{
                    bgcolor: '#b0161e', borderRadius: 999, px: 3, py: 1,
                    textTransform: 'none', fontWeight: 700, fontSize: 14,
                    boxShadow: '0 4px 20px rgba(176,22,30,0.5)',
                    '&:hover': { bgcolor: '#8e0f16', transform: 'translateY(-1px)', boxShadow: '0 6px 24px rgba(176,22,30,0.6)' },
                    transition: 'all 0.2s',
                  }}
                >
                  Mua sắm ngay
                </Button>
                <Button
                  onClick={() => navigate('/products')}
                  sx={{
                    color: '#fff', border: '1px solid rgba(255,255,255,0.55)',
                    borderRadius: 999, px: 3, py: 1,
                    textTransform: 'none', fontSize: 14,
                    backdropFilter: 'blur(6px)',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.18)', borderColor: '#fff' },
                    transition: 'all 0.2s',
                  }}
                >
                  Xem danh mục
                </Button>
              </Box>
            </Box>
          </Box>

          {/* Progress bar */}
          {!isHovered && (
            <Box
              key={`bar-${progressKey}`}
              sx={{
                position: 'absolute', bottom: 0, left: 0, height: 3,
                bgcolor: '#b0161e',
                animation: 'shimmerBar 5s linear forwards',
                borderRadius: '0 2px 2px 0',
              }}
            />
          )}

          {/* Dot indicators */}
          <Box sx={{ position: 'absolute', bottom: 16, right: 20, display: 'flex', gap: 1 }}>
            {BANNERS.map((_, i) => (
              <Box
                key={i}
                onClick={() => { stopAutoScroll(); setCurrentBannerIndex(i); setBannerKey(k => k + 1); setProgressKey(k => k + 1); startAutoScroll(); }}
                sx={{
                  width: i === currentBannerIndex ? 28 : 8,
                  height: 8,
                  borderRadius: 999,
                  bgcolor: i === currentBannerIndex ? '#b0161e' : 'rgba(255,255,255,0.55)',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                  animation: i === currentBannerIndex ? 'dotPulse 1.8s ease-in-out infinite' : 'none',
                  border: i === currentBannerIndex ? '1.5px solid rgba(255,255,255,0.6)' : 'none',
                }}
              />
            ))}
          </Box>

          {/* Arrow buttons */}
          {[{ pos: 'left', icon: <ArrowBackIosNew fontSize="small" />, fn: handlePrevBanner },
            { pos: 'right', icon: <ArrowForwardIos fontSize="small" />, fn: handleNextBanner }].map((btn) => (
            <IconButton
              key={btn.pos}
              onClick={btn.fn}
              sx={{
                position: 'absolute',
                [btn.pos]: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: '#fff',
                opacity: isHovered ? 1 : 0,
                transition: 'all 0.25s ease',
                '&:hover': {
                  bgcolor: '#b0161e',
                  borderColor: '#b0161e',
                  transform: 'translateY(-50%) scale(1.08)',
                }
              }}
            >
              {btn.icon}
            </IconButton>
          ))}
        </Box>

        <Box sx={{ mb: 8 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2.5 }}>
            <Box>
              <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#1b1b1b' }}>Khám phá không gian</Typography>
              <Typography sx={{ color: '#8a8a8a', fontSize: 12, letterSpacing: 1 }}>GỢI Ý CHO MỌI PHONG CÁCH SỐNG</Typography>
            </Box>
            <Button onClick={() => navigate('/products')} endIcon={<ArrowOutward fontSize="small" />} sx={{ textTransform: 'none', color: '#6b6b6b' }}>
              Xem tất cả
            </Button>
          </Box>

          <Grid container spacing={2}>
            {CATEGORIES.map((cat, idx) => (
              <Grid item xs={12} sm={idx === 0 ? 6 : 3} key={cat.id}>
                <Card
                  onClick={() => navigate(`/products?category=${cat.id}`)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 4,
                    overflow: 'hidden',
                    boxShadow: 'none',
                    position: 'relative',
                    height: idx === 0 ? { xs: 240, sm: 320 } : { xs: 200, sm: 320 },
                    '&:hover img': { transform: 'scale(1.05)' }
                  }}
                >
                  <CardMedia
                    component="img"
                    image={cat.image}
                    alt={cat.name}
                    sx={{ height: '100%', width: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                  />
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.45))' }} />
                  <Box sx={{ position: 'absolute', left: 16, bottom: 14, color: '#fff' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 20 }}>{cat.name}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box sx={{ mb: 8, borderRadius: 5, bgcolor: '#f3e8e8', p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <Chip label="ƯU ĐÃI GIỚI HẠN" sx={{ bgcolor: '#b0161e', color: '#fff', mb: 1.5, borderRadius: 1 }} />
              <Typography sx={{ fontSize: { xs: 24, md: 34 }, fontWeight: 700, lineHeight: 1.1, color: '#1f1f1f', mb: 1 }}>
                Flash Sale Nửa Đêm
              </Typography>
              <Typography sx={{ color: '#7a7a7a', mb: 2 }}>
                Săn các sản phẩm nổi bật với mức giá độc quyền trước khi hết giờ.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                {[rh, rm, rs].map((t) => (
                  <Box key={t} sx={{ bgcolor: '#fff', borderRadius: 2, px: 1.2, py: 0.7, minWidth: 50, textAlign: 'center', fontWeight: 700, color: '#b0161e' }}>
                    {t}
                  </Box>
                ))}
              </Box>
              <Button variant="contained" onClick={() => navigate('/products')} sx={{ bgcolor: '#b0161e', borderRadius: 999, px: 3, textTransform: 'none', '&:hover': { bgcolor: '#8e0f16' } }}>
                Khám phá ưu đãi
              </Button>
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }} ref={flashSaleContainerRef}>
                {flashSaleProducts.map((product) => (
                  <Card
                    key={product.id}
                    onClick={() => navigate(`/product/${product.id}`)}
                    sx={{ minWidth: 200, borderRadius: 3, boxShadow: 'none', cursor: 'pointer', border: '1px solid #eadede', '&:hover': { transform: 'translateY(-4px)' }, transition: 'all 0.25s ease' }}
                  >
                    <CardMedia
                      component="img"
                      height="150"
                      image={getFirstImage(product.images, 'https://via.placeholder.com/300')}
                      alt={product.name}
                      sx={{ objectFit: 'contain', p: 1.5, bgcolor: '#fff' }}
                    />
                    <CardContent>
                      <Typography noWrap sx={{ fontWeight: 600, mb: 0.5 }}>{product.name}</Typography>
                      <Typography sx={{ color: '#b0161e', fontWeight: 700 }}>
                        {new Intl.NumberFormat('vi-VN').format(Math.round(product.price * (1 - (product.flashSaleDiscount || 0) / 100)))} đ
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <IconButton onClick={() => scrollFlashSale('left')} sx={{ mr: 1, bgcolor: '#fff', border: '1px solid #e7dada' }}>
                  <ArrowBackIosNew fontSize="small" />
                </IconButton>
                <IconButton onClick={() => scrollFlashSale('right')} sx={{ bgcolor: '#fff', border: '1px solid #e7dada' }}>
                  <ArrowForwardIos fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
            <Typography sx={{ fontSize: 30, fontWeight: 700, color: '#1a1a1a' }}>Sản phẩm bán chạy</Typography>
            <Button onClick={() => navigate('/products')} endIcon={<ArrowForward />} sx={{ textTransform: 'none', color: '#6b6b6b' }}>
              Xem thêm
            </Button>
          </Box>

          {loading ? (
            <Typography color="text.secondary">Đang tải sản phẩm...</Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', sm: 'repeat(3,1fr)', md: 'repeat(5,1fr)' }, gap: 2 }}>
              {featuredProducts.map((product) => (
                <Card
                  key={product.id}
                  onClick={() => navigate(`/product/${product.id}`)}
                  sx={{
                    borderRadius: 3.5,
                    boxShadow: 'none',
                    border: '1px solid #eee',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#d6c7c7', transform: 'translateY(-3px)' },
                    transition: 'all 0.25s ease'
                  }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={getFirstImage(product.images, 'https://via.placeholder.com/300')}
                    alt={product.name}
                    sx={{ objectFit: 'contain', p: 1.5, bgcolor: '#f8f8f8' }}
                  />
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: 13 }} noWrap>{product.name}</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#b0161e', mt: 0.3 }}>
                      {new Intl.NumberFormat('vi-VN').format(product.price)} đ
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default HomePage;
