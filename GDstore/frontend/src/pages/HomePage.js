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

const CATEGORIES = [
  { id: 'phong-khach', name: 'Phòng khách', image: 'https://noithatmyan.vn/wp-content/uploads/2025/03/thiet-ke-noi-that-phong-khach-go-mdf-dep-hien-dai-dang-cap-02.jpg' },
  { id: 'nha-bep', name: 'Nhà bếp', image: 'https://media.noithatcaco.vn/media/api/images/02-2025/phong-bep-ket-hop-phong-2025-3.jpg' },
  { id: 'dien-tu', name: 'Điện tử', image: 'https://daiviet.biz/wp-content/uploads/2025/09/thiet-bi-dien-tu.jpeg' },
  { id: 'phong-ngu', name: 'Phòng ngủ', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=80' },
];

const BANNERS = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1615874959474-d609969a20ed?auto=format&fit=crop&w=1800&q=80'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=1800&q=80'
  },
  {
    id: 3,
    image: 'https://thietkenhadepmoi.com/wp-content/uploads/2023/01/phong-bep-dep-trang-tri-nha-bep-2024-769x500.jpg'
  }
];

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [bannerKey, setBannerKey] = useState(0);
  const navigate = useNavigate();

  const autoScrollInterval = useRef(null);
  const flashSaleContainerRef = useRef(null);

  useEffect(() => {
    fetchData();
    startAutoScroll();
    return () => stopAutoScroll();
  }, []);

  const startAutoScroll = () => {
    autoScrollInterval.current = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
      setBannerKey((k) => k + 1);
    }, 5000);
  };

  const stopAutoScroll = () => {
    if (autoScrollInterval.current) clearInterval(autoScrollInterval.current);
  };

  const handlePrevBanner = () => {
    stopAutoScroll();
    setCurrentBannerIndex((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
    setBannerKey((k) => k + 1);
    startAutoScroll();
  };

  const handleNextBanner = () => {
    stopAutoScroll();
    setCurrentBannerIndex((prev) => (prev + 1) % BANNERS.length);
    setBannerKey((k) => k + 1);
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
        <Box sx={{ position: 'relative', borderRadius: 5, overflow: 'hidden', mb: 7 }}>
          <Box
            key={bannerKey}
            sx={{
              width: '100%',
              height: { xs: 320, sm: 430, md: 520 },
              backgroundImage: `linear-gradient(90deg, rgba(15,15,15,0.65) 0%, rgba(15,15,15,0.18) 55%), url('${currentBanner.image}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'flex-end',
              p: { xs: 3, md: 6 }
            }}
          >
            <Box sx={{ maxWidth: 520, color: '#fff' }}>
              <Typography sx={{ fontSize: { xs: 28, md: 46 }, fontWeight: 700, lineHeight: 1.08, mb: 1.5 }}>
                Tinh tế trong từng không gian
              </Typography>
              <Typography sx={{ opacity: 0.85, fontSize: { xs: 13, md: 15 }, mb: 3 }}>
                Khám phá bộ sưu tập nội thất chọn lọc, mang đến phong cách sống hiện đại và đẳng cấp.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={() => navigate('/products')}
                  sx={{ bgcolor: '#b0161e', borderRadius: 999, px: 2.5, textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#8e0f16' } }}
                >
                  Mua sắm ngay
                </Button>
                <Button
                  onClick={() => navigate('/products')}
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.7)', border: '1px solid', borderRadius: 999, px: 2.5, textTransform: 'none' }}
                >
                  Xem danh mục
                </Button>
              </Box>
            </Box>
          </Box>

          {[{ pos: 'left', icon: <ArrowBackIosNew fontSize="small" />, fn: handlePrevBanner },
          { pos: 'right', icon: <ArrowForwardIos fontSize="small" />, fn: handleNextBanner }].map((btn) => (
            <IconButton
              key={btn.pos}
              onClick={btn.fn}
              sx={{
                position: 'absolute',
                [btn.pos]: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'rgba(255,255,255,0.85)',
                color: '#252525',
                '&:hover': { bgcolor: '#fff' }
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
