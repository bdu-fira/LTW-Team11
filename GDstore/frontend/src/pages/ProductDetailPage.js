import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Grid, Typography, Box, Button,
  Paper, IconButton, Snackbar, Alert, Breadcrumbs, Link, Rating, Divider, Card, CardMedia, CardContent, Avatar, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, CircularProgress, TextField, Checkbox, MenuItem
} from '@mui/material';
import {
  ShoppingCart, Add, Remove, CheckCircle, LocalShipping, VerifiedUser, ArrowForward,
  HelpOutline, Share, FavoriteBorder, DeleteOutline
} from '@mui/icons-material';
import API from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getFirstImage } from '../utils/imageUtils';

const BANK_OPTIONS = [
  'Vietcombank', 'BIDV', 'VietinBank', 'Agribank', 'Techcombank', 'MB Bank',
  'ACB', 'TPBank', 'VPBank', 'Sacombank', 'HDBank', 'SHB', 'SeABank', 'VIB',
  'OCB', 'MSB'
];

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState('detail');
  const [relatedProducts, setRelatedProducts] = useState([]);

  // Checkout dialog states
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderLoading, setOrderLoading] = useState(false);

  // Address states
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '', phone: '', address: '', city: '', district: '', ward: '', isDefault: false
  });
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // Review states
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [updatingReview, setUpdatingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);
  const [openEditReviewDialog, setOpenEditReviewDialog] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editReviewForm, setEditReviewForm] = useState({ rating: 5, comment: '' });
  const [openDeleteReviewDialog, setOpenDeleteReviewDialog] = useState(false);
  const [pendingDeleteReviewId, setPendingDeleteReviewId] = useState(null);
  const [reviewFilter, setReviewFilter] = useState('all'); // 'all' | 1|2|3|4|5 | 'hasComment'
  const [userReview, setUserReview] = useState(null); // review của user hiện tại

  // Bank states
  const [userBanks, setUserBanks] = useState([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '', accountNumber: '', accountName: '', branchName: '', linkedPhone: '', identityNumber: '', agreeBankTerms: false, isDefault: false
  });
  const [submittingBank, setSubmittingBank] = useState(false);

  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (user) {
      fetchUserAddresses();
      fetchUserBanks();
    }
    window.scrollTo(0, 0);
  }, [id, user]);

  useEffect(() => {
    if (product) {
      fetchRelatedProducts(product);
    }
  }, [product]);

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      const { data } = await API.get(`/reviews/${id}`);
      const allReviews = data.reviews || [];
      setReviews(allReviews);
      // Tìm đánh giá của user hiện tại
      if (user) {
        const mine = allReviews.find(r => r.userId === user.id);
        if (mine) {
          setUserReview(mine);
          setReviewForm({ rating: mine.rating, comment: mine.comment || '' });
        } else {
          setUserReview(null);
          setReviewForm({ rating: 5, comment: '' });
        }
      }
    } catch (e) {
      console.error('Lỗi tải đánh giá:', e);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/products/${id}`);
      setProduct(data);
    } catch (error) {
      console.error('Lỗi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async (currentProduct) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', 6);
      if (currentProduct.category) params.append('category', currentProduct.category);
      const res = await API.get(`/products?${params}`);
      const allProducts = res.data.products || [];
      // Exclude current product, take up to 5
      const related = allProducts.filter(p => Number(p.id) !== Number(currentProduct.id)).slice(0, 5);
      // If less than 5 in same category, top up with general products
      if (related.length < 5) {
        const fallback = await API.get('/products?limit=10');
        const extra = (fallback.data.products || []).filter(
          p => Number(p.id) !== Number(currentProduct.id) && !related.find(r => r.id === p.id)
        );
        setRelatedProducts([...related, ...extra].slice(0, 5));
      } else {
        setRelatedProducts(related);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const { data } = await API.get('/users/addresses');
      setUserAddresses(data || []);
      const defaultAddr = data.find(addr => addr.isDefault);
      if (defaultAddr) setSelectedAddress(defaultAddr);
      else if (data.length > 0) setSelectedAddress(data[0]);
    } catch (error) {
      console.error('Lỗi tải địa chỉ:', error);
    }
  };

  const fetchUserBanks = async () => {
    try {
      const { data } = await API.get('/users/banks');
      setUserBanks(data || []);
    } catch (error) {
      console.error('Lỗi tải ngân hàng:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.address) {
      setSnackbarMessage('Vui lòng nhập đầy đủ thông tin địa chỉ');
      setOpenSnackbar(true);
      return;
    }
    setSubmittingAddress(true);
    try {
      await API.post('/users/addresses', { ...newAddress, isDefault: userAddresses.length === 0 });
      setSnackbarMessage('Thêm địa chỉ thành công!');
      setOpenSnackbar(true);
      setShowAddressForm(false);
      setNewAddress({ fullName: '', phone: '', address: '', city: '', district: '', ward: '', isDefault: false });
      fetchUserAddresses();
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Thêm địa chỉ thất bại');
      setOpenSnackbar(true);
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleLinkBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      setSnackbarMessage('Vui lòng nhập đầy đủ thông tin ngân hàng');
      setOpenSnackbar(true);
      return;
    }
    setSubmittingBank(true);
    try {
      await API.post('/users/banks', { ...bankForm, isDefault: userBanks.length === 0 });
      setSnackbarMessage('Liên kết ngân hàng thành công!');
      setOpenSnackbar(true);
      setShowBankForm(false);
      setBankForm({ bankName: '', accountNumber: '', accountName: '' });
      fetchUserBanks();
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Liên kết thất bại');
      setOpenSnackbar(true);
    } finally {
      setSubmittingBank(false);
    }
  };

  const handleSubmitReview = async () => {
    if (userReview) {
      setSnackbarMessage('Bạn đã đánh giá sản phẩm này. Hãy dùng nút "Chỉnh sửa đánh giá" để cập nhật.');
      setOpenSnackbar(true);
      return;
    }
    if (!reviewForm.comment.trim()) {
      setSnackbarMessage('Vui lòng nhập nội dung đánh giá');
      setOpenSnackbar(true);
      return;
    }
    setSubmittingReview(true);
    try {
      const { data } = await API.post('/reviews', {
        productId: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      setSnackbarMessage('Cảm ơn bạn đã đánh giá sản phẩm!');
      setOpenSnackbar(true);
      setReviewForm({ rating: 5, comment: '' });
      await fetchReviews(); // Tải lại & cập nhật userReview
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Gửi đánh giá thất bại');
      setOpenSnackbar(true);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUpdateMyReview = async () => {
    if (!editingReview) return;
    if (!editReviewForm.comment.trim()) {
      setSnackbarMessage('Vui lòng nhập nội dung đánh giá');
      setOpenSnackbar(true);
      return;
    }
    setUpdatingReview(true);
    try {
      await API.put(`/reviews/${editingReview.id}`, {
        rating: editReviewForm.rating,
        comment: editReviewForm.comment
      });
      setSnackbarMessage('Cập nhật đánh giá thành công!');
      setOpenSnackbar(true);
      setOpenEditReviewDialog(false);
      setEditingReview(null);
      await fetchReviews();
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Cập nhật đánh giá thất bại');
      setOpenSnackbar(true);
    } finally {
      setUpdatingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    setDeletingReviewId(reviewId);
    try {
      await API.delete(`/reviews/${reviewId}`);
      setSnackbarMessage('Xóa đánh giá thành công');
      setOpenSnackbar(true);
      await fetchReviews();
    } catch (error) {
      setSnackbarMessage(error.response?.data?.message || 'Xóa đánh giá thất bại');
      setOpenSnackbar(true);
    } finally {
      setDeletingReviewId(null);
    }
  };

  const handleAskDeleteReview = (reviewId) => {
    setPendingDeleteReviewId(reviewId);
    setOpenDeleteReviewDialog(true);
  };

  const handleStartEditReview = (review) => {
    setEditingReviewId(review.id);
    setEditingReview(review);
    setEditReviewForm({
      rating: review.rating || 5,
      comment: review.comment || ''
    });
    setOpenEditReviewDialog(true);
  };

  // Hàm che tên người dùng kiểu Shopee: "Nguyễn Văn A" → "N*****A"
  const maskUsername = (name) => {
    if (!name) return 'Khách hàng';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      const n = parts[0];
      if (n.length <= 2) return n[0] + '*';
      return n[0] + '*'.repeat(n.length - 2) + n[n.length - 1];
    }
    const first = parts[0];
    const last = parts[parts.length - 1];
    return first[0] + '*'.repeat(5) + last[0];
  };

  // Lọc reviews theo filter hiện tại
  const filteredReviews = reviews.filter(r => {
    if (reviewFilter === 'all') return true;
    if (reviewFilter === 'hasComment') return r.comment && r.comment.trim().length > 0;
    return r.rating === reviewFilter;
  });

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    const result = await addToCart(product.id, quantity);
    setSnackbarMessage(result.success ? 'Đã thêm vào giỏ hàng!' : (result.message || 'Lỗi'));
    setOpenSnackbar(true);
  };

  const handleBuyNow = () => {
    if (!user) { navigate('/login'); return; }
    setOpenCheckoutDialog(true);
  };

  const handleCreateOrder = async () => {
    if (userAddresses.length === 0) {
      setShowAddressForm(true);
      setSnackbarMessage('Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng!');
      setOpenSnackbar(true);
      return;
    }
    if (!selectedAddress) {
      setSnackbarMessage('Vui lòng chọn địa chỉ giao hàng');
      setOpenSnackbar(true);
      return;
    }
    if (paymentMethod === 'banking' && userBanks.length === 0) {
      setShowBankForm(true);
      return;
    }
    setOrderLoading(true);
    try {
      const orderData = {
        shippingAddress: `${selectedAddress.address}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}`,
        phone: selectedAddress.phone,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'banking',
        notes: '',
        productId: product.id,
        quantity: quantity,
        price: finalDiscountedPrice
      };
      const { data } = await API.post('/orders/direct', orderData);
      if (data.success) {
        setSnackbarMessage('Đặt hàng thành công!');
        setOpenSnackbar(true);
        setOpenCheckoutDialog(false);
        setTimeout(() => { navigate('/profile?tab=7'); }, 2000);
      }
    } catch (error) {
      console.error('Lỗi tạo đơn hàng:', error);
      setSnackbarMessage(error.response?.data?.message || 'Đặt hàng thất bại');
      setOpenSnackbar(true);
    } finally {
      setOrderLoading(false);
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';

  if (loading || !product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  let images = Array.isArray(product.images) ? product.images
    : (typeof product.images === 'string' ? JSON.parse(product.images || '[]') : []);
  if (!images.length) images = ['https://via.placeholder.com/600'];

  const discountedPrice = product.isFlashSale ? product.price * 0.8 : product.price;
  const finalDiscountedPrice = product.isFlashSale
    ? product.price * (1 - (product.flashSaleDiscount || 0) / 100)
    : product.price;

  return (
    <Box sx={{ bgcolor: 'white', minHeight: '100vh', pb: 8, pt: 4, animation: 'fadeIn 0.4s ease both' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 4, fontSize: '0.75rem', fontWeight: 600, color: '#999', '& .MuiBreadcrumbs-separator': { margin: '0 6px' } }}>
          <Link underline="hover" color="inherit" onClick={() => navigate('/')} sx={{ cursor: 'pointer', '&:hover': { color: '#c62828' } }}>Trang chủ</Link>
          <Link underline="hover" color="inherit" onClick={() => navigate('/products')} sx={{ cursor: 'pointer', '&:hover': { color: '#c62828' } }}>{product.category || 'Gia dụng'}</Link>
          <Typography color="#1a1a1a" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>{product.name}</Typography>
        </Breadcrumbs>

        {/* ════ 1. HERO PRODUCT AREA ════ */}
        <Grid
          container
          spacing={{ xs: 4, md: 6, lg: 8 }}
          sx={{ mb: 8, flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'flex-start' }}
        >
          {/* Left: Gallery (Thumbnails + Main Image) */}
          <Grid item xs={12} md={7} sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column-reverse', md: 'row' }, height: { xs: 'auto', md: 550 } }}>
              {/* Thumbnails */}
              <Box sx={{
                display: 'flex', flexDirection: { xs: 'row', md: 'column' },
                gap: 2, width: { xs: '100%', md: '80px' }, overflowX: 'auto', flexShrink: 0,
                '&::-webkit-scrollbar': { display: 'none' }
              }}>
                {images.slice(0, 5).map((img, idx) => (
                  <Box key={idx} onClick={() => setSelectedImage(idx)}
                    sx={{
                      width: { xs: 60, md: '100%' }, aspectRatio: '1/1', cursor: 'pointer', borderRadius: '8px',
                      border: selectedImage === idx ? '2px solid #c62828' : '1px solid #e0e0e0',
                      overflow: 'hidden', transition: 'all 0.2s ease', '&:hover': { borderColor: '#c62828' },
                      p: 0.5, bgcolor: '#fff'
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </Box>
                ))}
              </Box>

              {/* Main Image */}
              <Box sx={{
                flex: 1, bgcolor: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', position: 'relative', border: '1px solid #f0f0f0', overflow: 'hidden'
              }}>
                <img src={images[selectedImage]} alt={product.name} style={{ width: '90%', height: '90%', objectFit: 'contain', animation: 'fadeIn 0.4s ease' }} />
              </Box>
            </Box>
          </Grid>

          {/* Right: Info Box */}
          <Grid item xs={12} md={5} sx={{ minWidth: 0 }}>
            <Box sx={{ pt: { md: 2 } }}>
              {product.isFlashSale && (
                <Chip label={`FLASH SALE - ${product.flashSaleDiscount || 15}% OFF`} size="small"
                  sx={{ bgcolor: '#ffebee', color: '#c62828', fontWeight: 800, borderRadius: '4px', mb: 2.5, letterSpacing: '0.5px' }} />
              )}

              <Typography variant="h4" fontWeight={800} color="#1a1a1a" sx={{ mb: 2, lineHeight: 1.3, fontSize: { xs: '1.6rem', md: '2rem' } }}>
                {product.name}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Rating value={reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0} precision={0.1} size="small" readOnly sx={{ color: '#c62828' }} />
                <Typography variant="body2" color="#777" fontWeight={500}>
                  ({reviewsLoading ? '...' : (reviews.length > 0 ? `${reviews.length} đánh giá khách hàng` : 'Chưa có đánh giá')})
                </Typography>
              </Box>

              {/* Price */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, mb: 0.5 }}>
                  <Typography variant="h3" color="#c62828" fontWeight={900}>
                    {formatPrice(finalDiscountedPrice)}
                  </Typography>
                  {product.price > finalDiscountedPrice && (
                    <Typography variant="h6" color="#9e9e9e" sx={{ textDecoration: 'line-through', fontWeight: 600, pb: 0.5 }}>
                      {formatPrice(product.price)}
                    </Typography>
                  )}
                </Box>
                {product.price > finalDiscountedPrice && (
                  <Typography variant="body2" fontWeight={700} sx={{ color: '#2e7d32' }}>
                    Tiết kiệm {formatPrice(product.price - finalDiscountedPrice)} ({product.flashSaleDiscount || 15}%)
                  </Typography>
                )}
              </Box>

              {/* Quantity */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Typography variant="body2" fontWeight={700} color="#666" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                  SỐ LƯỢNG
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '4px' }}>
                  <IconButton onClick={() => setQuantity(q => Math.max(1, q - 1))} sx={{ p: 1, borderRadius: 0 }}><Remove fontSize="small" /></IconButton>
                  <Typography variant="body2" fontWeight={700} sx={{ width: 44, textAlign: 'center' }}>{quantity}</Typography>
                  <IconButton onClick={() => setQuantity(q => q + 1)} sx={{ p: 1, borderRadius: 0 }}><Add fontSize="small" /></IconButton>
                </Box>
              </Box>

              {/* Stacked CTA Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4 }}>
                <Button variant="contained" size="large" onClick={handleBuyNow}
                  sx={{ bgcolor: '#c62828', py: 1.8, borderRadius: '6px', fontWeight: 800, fontSize: '1rem', '&:hover': { bgcolor: '#b71c1c' }, boxShadow: 'none' }}>
                  Mua ngay
                </Button>
                <Button variant="outlined" size="large" onClick={handleAddToCart}
                  startIcon={<ShoppingCart />}
                  sx={{ bgcolor: '#fff5f5', color: '#c62828', border: 'none', py: 1.8, borderRadius: '6px', fontWeight: 700, fontSize: '1rem', '&:hover': { bgcolor: '#ffebeb', border: 'none' } }}>
                  Thêm vào giỏ hàng
                </Button>
              </Box>

              {/* Horizontal Badges */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fbfaf9', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <LocalShipping sx={{ color: '#c62828' }} />
                  <Typography variant="body2" fontWeight={700} color="#333" sx={{ fontSize: '0.8rem' }}>Miễn phí vận chuyển</Typography>
                </Box>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: '#fbfaf9', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                  <VerifiedUser sx={{ color: '#c62828' }} />
                  <Typography variant="body2" fontWeight={700} color="#333" sx={{ fontSize: '0.8rem' }}>100% Chính hãng</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ════ 2. BOTTOM DETAILS AREA (Details + Spec Table) ════ */}
        <Grid container spacing={{ xs: 4, lg: 8 }} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h5" fontWeight={800} color="#1a1a1a" sx={{ mb: 3 }}>
              Chi tiết sản phẩm
            </Typography>
            <Typography variant="body2" color="#555" sx={{ lineHeight: 1.8, mb: 4 }}>
              {product.description || 'Sản phẩm là công cụ tối ưu cho các dự án thủ công, sửa chữa gia đình và đóng gói chuyên nghiệp. Được thiết kế với hệ thống tiên tiến, máy có thể đạt hiệu suất lý tưởng, giúp tiết kiệm thời gian chờ đợi đáng kể.'}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '8px', display: 'flex', gap: 2, alignItems: 'flex-start', bgcolor: 'white' }}>
                  <Box sx={{ bgcolor: '#fff5f5', p: 1, borderRadius: '50%' }}><CheckCircle sx={{ color: '#c62828', fontSize: 18 }} /></Box>
                  <Box>
                    <Typography variant="body2" fontWeight={800} color="#1a1a1a" sx={{ mb: 0.5 }}>Chất lượng cao</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>Vật liệu siêu bền bảo vệ độ bền cực tốt.</Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, border: '1px solid #f0f0f0', borderRadius: '8px', display: 'flex', gap: 2, alignItems: 'flex-start', bgcolor: 'white' }}>
                  <Box sx={{ bgcolor: '#fff5f5', p: 1, borderRadius: '50%' }}><VerifiedUser sx={{ color: '#c62828', fontSize: 18 }} /></Box>
                  <Box>
                    <Typography variant="body2" fontWeight={800} color="#1a1a1a" sx={{ mb: 0.5 }}>Bảo hành 12 tháng</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.5, display: 'block' }}>Cam kết bảo hành chính hãng trong vòng 1 năm.</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ bgcolor: '#fff5f5', p: { xs: 3, md: 4 }, borderRadius: '16px' }}>
              <Typography variant="h6" fontWeight={800} color="#1a1a1a" sx={{ mb: 3 }}>
                Thông số kỹ thuật
              </Typography>
              {[
                { label: 'Công suất', val: '60W - 100W' },
                { label: 'Nhiệt độ hoạt động', val: '140 - 220°C' },
                { label: 'Đường kính keo', val: '11mm' },
                { label: 'Chất liệu thân', val: 'Nhựa ABS chịu nhiệt' },
                { label: 'Trọng lượng', val: '350g' },
              ].map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(130px, 1fr) auto',
                    alignItems: 'start',
                    columnGap: 3,
                    py: 2,
                    borderBottom: i < 4 ? '1px dashed rgba(198,40,40,0.15)' : 'none'
                  }}
                >
                  <Typography variant="body2" color="#555" fontWeight={600} sx={{ lineHeight: 1.5 }}>
                    {s.label}
                  </Typography>
                  <Typography variant="body2" color="#1a1a1a" fontWeight={800} sx={{ lineHeight: 1.5, textAlign: 'right' }}>
                    {s.val}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 8, borderColor: '#eee' }} />

        {/* ════ 4. REVIEWS SECTION ════ */}
        <Box sx={{ bgcolor: '#fdf0f0', py: 6, px: { xs: 2, sm: 4, md: 6 }, borderRadius: '32px', mb: 8 }}>
          <Typography variant="h4" fontWeight={800} color="#3e2723" sx={{ mb: 4, letterSpacing: '-0.5px' }}>
            Đánh giá từ khách hàng
          </Typography>

          <Grid container spacing={4} sx={{ mb: 6 }}>
            {/* L: Rating Summary (Big card) */}
            <Grid item xs={12} md={4}>
              <Box sx={{ bgcolor: '#fff5f5', borderRadius: '24px', py: 5, px: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="h1" fontWeight={800} color="#b71c1c" sx={{ mb: 1, fontSize: '4.5rem', lineHeight: 1 }}>
                  {(reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0).toFixed(1)}
                </Typography>
                <Rating value={reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0} precision={0.1} readOnly sx={{ color: '#b71c1c', mb: 2, fontSize: '1.8rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ mb: 4, fontSize: '0.85rem' }}>Dựa trên {reviews.length} lượt đánh giá thực tế</Typography>

                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {[
                    { s: 5, c: reviews.filter(r => r.rating === 5).length },
                    { s: 4, c: reviews.filter(r => r.rating === 4).length },
                    { s: 3, c: reviews.filter(r => r.rating === 3).length },
                    { s: 2, c: reviews.filter(r => r.rating === 2).length },
                    { s: 1, c: reviews.filter(r => r.rating === 1).length }
                  ].map(line => {
                    const percent = reviews.length > 0 ? Math.round((line.c / reviews.length) * 100) : 0;
                    return (
                      <Box key={line.s} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" fontWeight={800} color="#3e2723" sx={{ minWidth: 12 }}>{line.s}</Typography>
                        <Box sx={{ flex: 1, height: 8, bgcolor: '#fff', borderRadius: 10, overflow: 'hidden' }}>
                          <Box sx={{ width: `${percent}%`, bgcolor: '#b71c1c', height: '100%', borderRadius: 10 }} />
                        </Box>
                        <Typography variant="caption" color="#795548" sx={{ minWidth: 32, textAlign: 'right', fontWeight: 600 }}>{percent}%</Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Grid>

            {/* R: Review Form - White Background Wrapper */}
            <Grid item xs={12} md={8}>
              <Box sx={{ bgcolor: '#ffffff', borderRadius: '24px', p: { xs: 3, md: 5 }, height: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.04)' }}>
                <Typography variant="h6" fontWeight={800} color="#3e2723" sx={{ mb: 3 }}>Viết đánh giá của bạn</Typography>
                {userReview && (
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Bạn đã đánh giá sản phẩm này. Bạn có thể chỉnh sửa đánh giá của mình bên dưới.
                  </Alert>
                )}

                {!user && (
                  <Alert severity="info" sx={{ mb: 3 }}>Bạn cần đăng nhập để viết đánh giá.</Alert>
                )}

                <Grid container spacing={3} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight={700} color="#5d4037" sx={{ mb: 1.5 }}>Tên của bạn</Typography>
                    <TextField
                      fullWidth size="medium" placeholder="Nhập tên..."
                      value={user ? user.name : ''} disabled={!user}
                      sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', '& fieldset': { border: 'none' } } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" fontWeight={700} color="#5d4037" sx={{ mb: 1.5 }}>Đánh giá (Sao)</Typography>
                    <Box sx={{ height: 53, bgcolor: '#fce4e4', borderRadius: '12px', display: 'flex', alignItems: 'center', px: 2 }}>
                      <Rating value={reviewForm.rating} onChange={(e, val) => setReviewForm({ ...reviewForm, rating: val })} disabled={!user} sx={{ color: '#b71c1c' }} />
                    </Box>
                  </Grid>
                </Grid>

                <Typography variant="body2" fontWeight={700} color="#5d4037" sx={{ mb: 1.5 }}>Nội dung đánh giá</Typography>
                <TextField
                  fullWidth multiline rows={4}
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                  disabled={!user}
                  value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  sx={{ mb: 4, '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', '& fieldset': { border: 'none' } } }}
                />

                <Button
                  variant="contained"
                  disabled={!user || submittingReview}
                  onClick={handleSubmitReview}
                  sx={{ bgcolor: '#21100b', color: 'white', fontWeight: 800, px: 5, py: 1.5, borderRadius: '12px', textTransform: 'none', '&:hover': { bgcolor: '#3e2723' } }}>
                  {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {/* Review List */}
          <Box sx={{ mt: 2, px: { xs: 0, md: 2 } }}>
            {reviewsLoading ? (
              <Typography variant="body2" color="text.secondary">Đang tải đánh giá...</Typography>
            ) : reviews.length === 0 ? (
              <Typography variant="body2" color="#795548">Hãy trở thành người đầu tiên đánh giá sản phẩm này!</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {reviews.map((rv, idx) => (
                  <Box key={idx} sx={{ py: 4, borderBottom: idx < reviews.length - 1 ? '1px solid #f9ebeb' : 'none', display: 'flex', gap: 3 }}>
                    <Avatar sx={{ width: 50, height: 50, bgcolor: '#fce4e4', color: '#b71c1c', fontWeight: 900, fontSize: '1.2rem' }}>
                      {rv.User?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="body1" fontWeight={800} color="#3e2723">{maskUsername(rv.User?.name)}</Typography>
                        <Typography variant="caption" color="#a1887f" fontWeight={500}>{new Date(rv.createdAt).toLocaleDateString('vi-VN')}</Typography>
                      </Box>
                      <Rating value={rv.rating} size="small" readOnly sx={{ color: '#b71c1c', fontSize: '1rem', mb: 1.5 }} />
                      <Typography variant="body2" color="#5d4037" sx={{ lineHeight: 1.7 }}>{rv.comment}</Typography>
                      <Box sx={{ display: 'flex', gap: 2, mt: 1.5 }}>
                        {user?.id === rv.userId && (
                          <Button
                            size="small"
                            variant="text"
                            sx={{ textTransform: 'none', px: 0, minWidth: 0 }}
                            onClick={() => handleStartEditReview(rv)}
                          >
                            {editingReviewId === rv.id ? 'Đang chỉnh sửa' : 'Chỉnh sửa đánh giá'}
                          </Button>
                        )}
                        {(user?.role === 'admin') && (
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteOutline />}
                            sx={{ textTransform: 'none', px: 0, minWidth: 0 }}
                            disabled={deletingReviewId === rv.id}
                            onClick={() => handleAskDeleteReview(rv.id)}
                          >
                            {deletingReviewId === rv.id ? 'Đang xóa...' : 'Xóa đánh giá'}
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
        <Divider sx={{ mb: 8, borderColor: '#eee' }} />

        {/* ════ 3. RELATED PRODUCTS ════ */}
        <Box sx={{ mb: 10 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#1a1a1a">Sản phẩm liên quan</Typography>
              <Typography variant="caption" color="text.secondary">Có thể bạn cũng sẽ cần những sản phẩm này</Typography>
            </Box>
            <Button endIcon={<ArrowForward fontSize="small" />} onClick={() => navigate('/products')} sx={{ color: '#c62828', fontWeight: 600, textTransform: 'none' }}>Xem tất cả</Button>
          </Box>
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 2.5
          }}>
            {relatedProducts.slice(0, 4).map((p, i) => (
              <Card
                key={p.id}
                onClick={() => navigate(`/product/${p.id}`)}
                sx={{
                  cursor: 'pointer', borderRadius: '12px', border: '1px solid #f0f0f0', boxShadow: 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.08)' }
                }}
              >
                <Box sx={{ bgcolor: '#fbfaf9', pt: 3, px: 2, pb: 1, display: 'flex', justifyContent: 'center' }}>
                  <CardMedia component="img" image={getFirstImage(p.images, 'https://via.placeholder.com/200')} alt={p.name}
                    sx={{ objectFit: 'contain', height: 160, transition: 'transform 0.4s ease', '&:hover': { transform: 'scale(1.05)' } }} />
                </Box>
                <CardContent sx={{ p: 2, pb: '16px !important' }}>
                  <Typography variant="body2" fontWeight={700} color="#1a1a1a" sx={{ mb: 1 }}>{p.name}</Typography>
                  <Typography variant="body1" color="#c62828" fontWeight={800}>
                    {p.isFlashSale ? formatPrice(p.price * (1 - (p.flashSaleDiscount || 0) / 100)) : formatPrice(p.price)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>

      </Container>\n\n      {/* Dialog Thanh toán mua ngay giống Cart */}
      <Dialog open={openEditReviewDialog} onClose={() => setOpenEditReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Chỉnh sửa đánh giá</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" fontWeight={700} color="#5d4037" sx={{ mb: 1.5 }}>Đánh giá (Sao)</Typography>
            <Box sx={{ height: 53, bgcolor: '#fce4e4', borderRadius: '12px', display: 'flex', alignItems: 'center', px: 2, mb: 2 }}>
              <Rating value={editReviewForm.rating} onChange={(e, val) => setEditReviewForm({ ...editReviewForm, rating: val })} sx={{ color: '#b71c1c' }} />
            </Box>
            <Typography variant="body2" fontWeight={700} color="#5d4037" sx={{ mb: 1.5 }}>Nội dung đánh giá</Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Chia sẻ trải nghiệm của bạn..."
              value={editReviewForm.comment}
              onChange={(e) => setEditReviewForm({ ...editReviewForm, comment: e.target.value })}
              sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', '& fieldset': { border: 'none' } } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditReviewDialog(false)}>Hủy</Button>
          <Button onClick={handleUpdateMyReview} variant="contained" disabled={updatingReview} sx={{ bgcolor: '#b71c1c' }}>
            {updatingReview ? 'Đang cập nhật...' : 'Cập nhật đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteReviewDialog} onClose={() => setOpenDeleteReviewDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>Xác nhận xóa đánh giá</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Bạn có chắc muốn xóa đánh giá này không? Hành động này không thể hoàn tác.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDeleteReviewDialog(false)} sx={{ color: '#666' }}>
            Hủy
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={!pendingDeleteReviewId || deletingReviewId === pendingDeleteReviewId}
            onClick={async () => {
              if (!pendingDeleteReviewId) return;
              await handleDeleteReview(pendingDeleteReviewId);
              setOpenDeleteReviewDialog(false);
              setPendingDeleteReviewId(null);
            }}
            sx={{ fontWeight: 700 }}
          >
            {deletingReviewId === pendingDeleteReviewId ? 'Đang xóa...' : 'Xóa đánh giá'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Thanh toán mua ngay giống Cart */}
      <Dialog open={openCheckoutDialog} onClose={() => setOpenCheckoutDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#c62828', color: 'white' }}>
          <Typography variant="h6">Chọn phương thức thanh toán</Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {/* Summary items */}
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f9f9f9', borderRadius: '12px', display: 'flex', gap: 2 }}>
            <img src={images[0]} alt="" style={{ width: 48, height: 48, borderRadius: '8px', objectFit: 'cover' }} />
            <Box>
              <Typography variant="body2" fontWeight={800}>{product.name}</Typography>
              <Typography variant="caption" color="text.secondary">Số lượng: {quantity}</Typography>
              <Typography variant="body1" fontWeight={800} color="#c62828">{formatPrice(finalDiscountedPrice * quantity)}</Typography>
              {product.isFlashSale && (
                <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9e9e9e' }}>
                  {formatPrice(product.price * quantity)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Địa chỉ giao hàng */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>📍 Địa chỉ giao hàng</Typography>

            {userAddresses.length === 0 && !showAddressForm && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Bạn chưa có địa chỉ giao hàng.
                <Button size="small" onClick={() => setShowAddressForm(true)} sx={{ ml: 1, color: '#c62828' }}>
                  Thêm địa chỉ
                </Button>
              </Alert>
            )}

            {showAddressForm && (
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>➕ Thêm địa chỉ mới</Typography>
                <TextField
                  fullWidth size="small" label="Họ tên người nhận *"
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth size="small" label="Số điện thoại *"
                  value={newAddress.phone}
                  inputProps={{ maxLength: 10 }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setNewAddress({ ...newAddress, phone: value });
                  }}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth size="small" label="Địa chỉ cụ thể *"
                  value={newAddress.address}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  sx={{ mb: 1 }}
                />
                <TextField
                  fullWidth size="small" label="Tỉnh/Thành phố"
                  value={newAddress.city}
                  onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  <Button variant="outlined" size="small" onClick={() => setShowAddressForm(false)}>Hủy</Button>
                  <Button variant="contained" size="small" onClick={handleAddAddress}
                    disabled={submittingAddress}
                    sx={{ bgcolor: '#c62828' }}>
                    {submittingAddress ? <CircularProgress size={20} /> : 'Lưu địa chỉ'}
                  </Button>
                </Box>
              </Box>
            )}

            {userAddresses.length > 0 && (
              <RadioGroup value={selectedAddress?.id} onChange={(e) => {
                const addr = userAddresses.find(a => a.id === parseInt(e.target.value));
                setSelectedAddress(addr);
              }}>
                {userAddresses.map((addr) => (
                  <FormControlLabel
                    key={addr.id} value={addr.id}
                    control={<Radio />}
                    label={
                      <Box>
                        <Typography variant="body2" fontWeight="bold">{addr.fullName} | {addr.phone}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {addr.address}, {addr.ward}, {addr.district}, {addr.city}
                        </Typography>
                        {addr.isDefault && <Chip label="Mặc định" size="small" sx={{ ml: 1, bgcolor: '#c62828', color: 'white' }} />}
                      </Box>
                    }
                  />
                ))}
              </RadioGroup>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Phương thức thanh toán */}
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>💳 Phương thức thanh toán</Typography>
          <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            <FormControlLabel
              value="cod" control={<Radio />}
              label={<Typography>Tiền mặt khi nhận hàng (COD)</Typography>}
            />
            <FormControlLabel
              value="banking" control={<Radio />}
              label={<Typography>Chuyển khoản ngân hàng / ATM</Typography>}
            />
          </RadioGroup>

          {/* Phần ngân hàng */}
          {paymentMethod === 'banking' && (
            <Box sx={{ mt: 2 }}>
              {userBanks.length === 0 && !showBankForm && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Bạn chưa liên kết tài khoản ngân hàng.
                  <Button size="small" onClick={() => setShowBankForm(true)} sx={{ ml: 1, color: '#c62828' }}>
                    Liên kết ngay
                  </Button>
                </Alert>
              )}

              {showBankForm && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>🏦 Liên kết tài khoản ngân hàng</Typography>
                  <Typography variant="caption" sx={{ color: '#8c8c8c', fontWeight: 700, letterSpacing: 0.4, display: 'block', mb: 1 }}>
                    BƯỚC 1 - THÔNG TIN TÀI KHOẢN
                  </Typography>
                  <TextField fullWidth size="small" select label="Chọn ngân hàng"
                    value={bankForm.bankName}
                    onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                    sx={{ mb: 1 }}
                  >
                    {BANK_OPTIONS.map((bankName) => (
                      <MenuItem key={bankName} value={bankName}>{bankName}</MenuItem>
                    ))}
                  </TextField>
                  <TextField fullWidth size="small" label="Số tài khoản"
                    value={bankForm.accountNumber}
                    onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <TextField fullWidth size="small" label="Tên tài khoản"
                    value={bankForm.accountName}
                    onChange={(e) => setBankForm({ ...bankForm, accountName: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <TextField fullWidth size="small" label="Chi nhánh ngân hàng"
                    value={bankForm.branchName}
                    onChange={e => setBankForm({ ...bankForm, branchName: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <TextField fullWidth size="small" label="Số điện thoại liên kết ngân hàng"
                    value={bankForm.linkedPhone}
                    onChange={e => setBankForm({ ...bankForm, linkedPhone: e.target.value.replace(/\D/g, '') })}
                    sx={{ mb: 1 }}
                  />
                  <TextField fullWidth size="small" label="CCCD/CMND người liên kết"
                    value={bankForm.identityNumber}
                    onChange={e => setBankForm({ ...bankForm, identityNumber: e.target.value.replace(/\D/g, '') })}
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel sx={{ display: 'block', mb: 0.5 }} control={<Checkbox size="small" checked={bankForm.agreeBankTerms} onChange={e => setBankForm({ ...bankForm, agreeBankTerms: e.target.checked })} />} label={<Typography variant="body2">Tôi xác nhận thông tin trên là đúng và đồng ý liên kết tài khoản ngân hàng.</Typography>} />
                  <FormControlLabel sx={{ display: 'block', mb: 1 }} control={<Checkbox size="small" checked={bankForm.isDefault} onChange={e => setBankForm({ ...bankForm, isDefault: e.target.checked })} />} label={<Typography variant="body2">Đặt làm ngân hàng mặc định</Typography>} />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => setShowBankForm(false)}>Hủy</Button>
                    <Button variant="contained" size="small" onClick={handleLinkBank}
                      disabled={submittingBank} sx={{ bgcolor: '#c62828' }}>
                      {submittingBank ? <CircularProgress size={20} /> : 'Liên kết'}
                    </Button>
                  </Box>
                </Box>
              )}

              {userBanks.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>✅ Tài khoản đã liên kết:</Typography>
                  {userBanks.map((bank, idx) => (
                    <Box key={idx} sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, mb: 1 }}>
                      <Typography variant="body2" fontWeight="bold">{bank.bankName}</Typography>
                      <Typography variant="caption" display="block">Số TK: {bank.accountNumber}</Typography>
                      <Typography variant="caption" display="block">Chủ TK: {bank.accountName}</Typography>
                      {bank.isDefault && <Chip label="Mặc định" size="small" sx={{ mt: 1, bgcolor: '#c62828', color: 'white' }} />}
                    </Box>
                  ))}
                  <Alert severity="success" sx={{ mt: 2 }}>
                    ✅ Bạn đã sẵn sàng thanh toán bằng chuyển khoản ngân hàng.
                  </Alert>
                </Box>
              )}
            </Box>
          )}

          {paymentMethod === 'cod' && (
            <Alert severity="info" sx={{ mt: 2 }}>
              💰 Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng.
            </Alert>
          )}

          {userAddresses.length === 0 && !showAddressForm && (
            <Alert severity="error" sx={{ mt: 2 }}>
              ⚠️ Vui lòng thêm địa chỉ giao hàng để tiếp tục.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCheckoutDialog(false)}>Hủy</Button>
          <Button
            onClick={handleCreateOrder} variant="contained"
            disabled={orderLoading || userAddresses.length === 0 || (paymentMethod === 'banking' && userBanks.length === 0 && !showBankForm)}
            sx={{ bgcolor: '#c62828', '&:hover': { bgcolor: '#b32025' } }}
          >
            {orderLoading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbarMessage.includes('thành công') ? 'success' : 'info'} sx={{ borderRadius: '12px' }}>{snackbarMessage}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductDetailPage;