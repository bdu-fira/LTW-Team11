import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Paper, Grid, Box, IconButton, Button, TextField, Divider, Card, CardMedia, CardContent,
  Dialog, DialogTitle, DialogContent, DialogActions, RadioGroup, FormControlLabel, Radio, Alert, Snackbar,
  CircularProgress, Chip, Checkbox, MenuItem
} from '@mui/material';
import { Add, Remove, DeleteOutline, Lock, ArrowBack, LocalAtm, CreditCard, AccountBalance, ArrowForward } from '@mui/icons-material';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { getFirstImage } from '../utils/imageUtils';

const BANK_OPTIONS = [
  'Vietcombank', 'BIDV', 'VietinBank', 'Agribank', 'Techcombank', 'MB Bank',
  'ACB', 'TPBank', 'VPBank', 'Sacombank', 'HDBank', 'SHB', 'SeABank', 'VIB',
  'OCB', 'MSB'
];

// ✅ Validate SĐT: bắt đầu bằng 0, đúng 10 số
const phoneRegex = /^0\d{9}$/;
const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Vui lòng nhập số điện thoại';
  if (!phoneRegex.test(phone)) return 'Số điện thoại phải bắt đầu bằng 0 và đủ 10 chữ số';
  return '';
};

const CartPage = () => {
  const { cart, updateCartItem, removeFromCart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // Address states
  const [userAddresses, setUserAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    isDefault: false
  });
  const [submittingAddress, setSubmittingAddress] = useState(false);

  // ✅ State lỗi SĐT cho form địa chỉ trong cart
  const [cartPhoneError, setCartPhoneError] = useState('');

  // Bank linking states
  const [userBanks, setUserBanks] = useState([]);
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    bankName: '', accountNumber: '', accountName: '', branchName: '', linkedPhone: '', identityNumber: '', agreeBankTerms: false, isDefault: false
  });
  const [submittingBank, setSubmittingBank] = useState(false);

  useEffect(() => {
    fetchRelatedProducts();
    fetchUserBanks();
    fetchUserAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const fetchRelatedProducts = async () => {
    try {
      // Get category from first cart item to show relevant suggestions
      const firstCategory = cart.length > 0 ? cart[0]?.product?.category : '';
      const params = new URLSearchParams();
      params.append('limit', 10);
      if (firstCategory) params.append('category', firstCategory);
      const res = await API.get(`/products?${params}`);
      // Exclude products already in cart
      const cartIds = cart.map(item => item.product?.id || item.productId);
      const filtered = (res.data.products || []).filter(p => !cartIds.includes(p.id));
      setRelatedProducts(filtered.slice(0, 10));
    } catch (error) {
      console.error(error);
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

  const fetchUserAddresses = async () => {
    try {
      const { data } = await API.get('/users/addresses');
      setUserAddresses(data || []);
      const defaultAddr = data.find(addr => addr.isDefault);
      if (defaultAddr) {
        setSelectedAddress(defaultAddr);
      } else if (data.length > 0) {
        setSelectedAddress(data[0]);
      }
    } catch (error) {
      console.error('Lỗi tải địa chỉ:', error);
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.fullName || !newAddress.address) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin địa chỉ' });
      return;
    }

    // ✅ Validate SĐT trước khi lưu địa chỉ
    const phoneErr = validatePhone(newAddress.phone);
    if (phoneErr) {
      setCartPhoneError(phoneErr);
      return;
    }

    setSubmittingAddress(true);
    try {
      await API.post('/users/addresses', {
        ...newAddress,
        isDefault: userAddresses.length === 0
      });
      setMessage({ type: 'success', text: 'Thêm địa chỉ thành công!' });
      setShowAddressForm(false);
      setCartPhoneError('');
      setNewAddress({ fullName: '', phone: '', address: '', city: '', district: '', ward: '', isDefault: false });
      fetchUserAddresses();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Thêm địa chỉ thất bại' });
    } finally {
      setSubmittingAddress(false);
    }
  };

  const handleLinkBank = async () => {
    if (!bankForm.bankName || !bankForm.accountNumber || !bankForm.accountName) {
      setMessage({ type: 'error', text: 'Vui lòng điền đủ tên ngân hàng, số tài khoản và tên chủ tài khoản' });
      return;
    }
    if (!bankForm.branchName || !bankForm.linkedPhone || !bankForm.identityNumber) {
      setMessage({ type: 'error', text: 'Vui lòng hoàn tất thông tin chi nhánh, số điện thoại và CCCD/CMND' });
      return;
    }
    if (!/^\d{9,12}$/.test(bankForm.identityNumber)) {
      setMessage({ type: 'error', text: 'CCCD/CMND phải từ 9 đến 12 chữ số' });
      return;
    }
    if (!/^\d{10}$/.test(bankForm.linkedPhone)) {
      setMessage({ type: 'error', text: 'Số điện thoại liên kết phải gồm 10 chữ số' });
      return;
    }
    if (!bankForm.agreeBankTerms) {
      setMessage({ type: 'error', text: 'Bạn cần đồng ý điều khoản liên kết tài khoản ngân hàng' });
      return;
    }

    setSubmittingBank(true);
    try {
      await API.post('/users/banks', {
        ...bankForm,
        isDefault: userBanks.length === 0 ? true : bankForm.isDefault
      });
      setMessage({ type: 'success', text: 'Liên kết ngân hàng thành công!' });
      setShowBankForm(false);
      setBankForm({ bankName: '', accountNumber: '', accountName: '', branchName: '', linkedPhone: '', identityNumber: '', agreeBankTerms: false, isDefault: false });
      fetchUserBanks();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Liên kết thất bại, vui lòng thử lại' });
    } finally {
      setSubmittingBank(false);
    }
  };

  const handleQuantityChange = async (itemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity < 1) return;
    await updateCartItem(itemId, newQuantity);
  };

  const formatPrice = (price) => new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';

  const subtotal = getCartTotal();
  const shipping = 0;
  const originalSubtotal = cart.reduce((sum, item) => {
    const originalPrice = item.Product?.price || 0;
    return sum + (originalPrice * item.quantity);
  }, 0);
  const discount = Math.max(0, originalSubtotal - subtotal);
  const total = subtotal + shipping;

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      setMessage({ type: 'error', text: 'Giỏ hàng trống, vui lòng thêm sản phẩm' });
      return;
    }
    setOpenPaymentDialog(true);
  };

  const handleCreateOrder = async () => {
    if (userAddresses.length === 0) {
      setShowAddressForm(true);
      setMessage({ type: 'warning', text: 'Vui lòng thêm địa chỉ giao hàng trước khi đặt hàng!' });
      return;
    }

    if (!selectedAddress) {
      setMessage({ type: 'error', text: 'Vui lòng chọn địa chỉ giao hàng' });
      return;
    }

    if (paymentMethod === 'banking' && userBanks.length === 0) {
      setShowBankForm(true);
      return;
    }

    setLoading(true);
    try {
      const orderData = {
        shippingAddress: `${selectedAddress.address}, ${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.city}`,
        phone: selectedAddress.phone,
        paymentMethod: paymentMethod === 'cod' ? 'cod' : 'banking',
        notes: ''
      };

      const { data } = await API.post('/orders', orderData);

      if (data.success) {
        setOrderSuccess(true);
        setMessage({ type: 'success', text: 'Đặt hàng thành công!' });
        await clearCart();
        setOpenPaymentDialog(false);
        setTimeout(() => {
          navigate('/profile?tab=7');
        }, 2000);
      }
    } catch (error) {
      console.error('Lỗi tạo đơn hàng:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Đặt hàng thất bại' });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0 && !orderSuccess) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8, textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h4" fontWeight={900} color="#222" gutterBottom>Giỏ hàng của bạn đang trống</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>Hãy khám phá các sản phẩm tuyệt vời của HomeStore và thêm vào giỏ hàng nhé!</Typography>
        <Button variant="contained" size="large" onClick={() => navigate('/products')} sx={{ bgcolor: '#c62828', '&:hover': { bgcolor: '#b32025' }, px: 6, py: 1.5, borderRadius: 2 }}>
          Tiếp tục mua sắm
        </Button>
      </Container>
    );
  }

  if (orderSuccess) {
    return (
      <Container maxWidth="lg" sx={{ mt: 8, mb: 8, textAlign: 'center' }}>
        <Typography variant="h3" color="#c62828" gutterBottom>🎉 ĐẶT HÀNG THÀNH CÔNG!</Typography>
        <Typography variant="h6" sx={{ mb: 4 }}>Cảm ơn bạn đã mua sắm tại HomeStore</Typography>
        <Button variant="contained" onClick={() => navigate('/profile?tab=7')} sx={{ bgcolor: '#c62828' }}>
          Xem đơn hàng của tôi
        </Button>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 4, pb: 8, animation: 'fadeIn 0.4s ease both' }}>
      <Container maxWidth="lg">
        <Snackbar
          open={message.text !== ''}
          autoHideDuration={3000}
          onClose={() => setMessage({ type: '', text: '' })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={message.type || 'info'} onClose={() => setMessage({ type: '', text: '' })}>
            {message.text}
          </Alert>
        </Snackbar>

        <Box sx={{ mb: 4, animation: 'slideDown 0.5s ease both' }}>
          <Typography variant="h3" fontWeight={900} color="#222" letterSpacing="-1px">Giỏ hàng của bạn</Typography>
          <Typography variant="subtitle2" color="text.secondary" fontWeight={600} letterSpacing="1px" sx={{ mt: 1 }}>KIỂM TRA &amp; THANH TOÁN</Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #eaeaea', pb: 2, mb: 3 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 4 }}>SẢN PHẨM</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 2, textAlign: 'center' }}>GIÁ</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 2, textAlign: 'center' }}>SỐ LƯỢNG</Typography>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ flex: 2, textAlign: 'right' }}>TẠM TÍNH</Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {cart.map((item, index) => {
                const originalPrice = item.Product?.price || 0;
                const itemPrice = item.Product?.isFlashSale
                  ? originalPrice * (1 - (item.Product.flashSaleDiscount || 0) / 100)
                  : originalPrice;
                return (
                  <Paper key={item.id} elevation={0}
                    sx={{
                      p: 2, borderRadius: 3, border: '1px solid #f0f0f0',
                      display: 'flex', alignItems: 'center',
                      animation: `staggerReveal 0.5s ease ${index * 0.08}s both`,
                      transition: 'box-shadow 0.25s ease',
                      '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderColor: '#e0e0e0' }
                    }}
                  >
                    <Box sx={{ flex: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ width: 80, height: 80, bgcolor: '#f5f5f5', borderRadius: 2, p: 1, flexShrink: 0 }}>
                        <img
                          src={getFirstImage(item.Product?.images, 'https://via.placeholder.com/100')}
                          alt={item.Product?.name}
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700} color="#222">{item.Product?.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Danh mục: {item.Product?.category || 'Đồ gia dụng'}</Typography>
                        <Box
                          onClick={() => removeFromCart(item.id)}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mt: 1, color: '#c62828', '&:hover': { opacity: 0.8 } }}
                        >
                          <DeleteOutline sx={{ fontSize: 16 }} />
                          <Typography variant="caption" fontWeight={600}>Xóa khỏi giỏ</Typography>
                        </Box>
                      </Box>
                    </Box>

                    <Box sx={{ flex: 2, textAlign: 'center' }}>
                      <Typography variant="subtitle2" fontWeight={700} color={item.Product?.isFlashSale ? '#c62828' : '#222'}>
                        {formatPrice(itemPrice)}
                      </Typography>
                      {item.Product?.isFlashSale && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9e9e9e', display: 'block' }}>
                          {formatPrice(originalPrice)}
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#fdf2f2', borderRadius: 1.5, p: 0.25 }}>
                        <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity, -1)} sx={{ color: '#c62828', p: 0.5 }}>
                          <Remove fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                        <Typography sx={{ px: 1.5, minWidth: 30, textAlign: 'center', fontWeight: 600, fontSize: '0.9rem' }}>{item.quantity}</Typography>
                        <IconButton size="small" onClick={() => handleQuantityChange(item.id, item.quantity, 1)} sx={{ color: '#c62828', p: 0.5 }}>
                          <Add fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ flex: 2, textAlign: 'right' }}>
                      <Typography variant="subtitle1" fontWeight={800} color="#c62828">
                        {formatPrice(itemPrice * item.quantity)}
                      </Typography>
                      {item.Product?.isFlashSale && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9e9e9e', display: 'block' }}>
                          {formatPrice(originalPrice * item.quantity)}
                        </Typography>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button onClick={() => navigate('/products')} startIcon={<ArrowBack />} sx={{ color: '#555', fontWeight: 600 }}>
                Tiếp tục mua sắm
              </Button>
            </Box>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ bgcolor: '#fff5f5', p: 4, borderRadius: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h5" fontWeight={800} color="#222" sx={{ mb: 4 }}>Tóm tắt đơn hàng</Typography>

              <Box sx={{ mb: 4 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, display: 'block' }}>MÃ GIẢM GIÁ</Typography>
                <Box sx={{ display: 'flex' }}>
                  <TextField
                    size="small"
                    placeholder="Nhập mã ưu đãi..."
                    sx={{ bgcolor: 'white', flex: 1, '& .MuiOutlinedInput-root': { borderTopRightRadius: 0, borderBottomRightRadius: 0 } }}
                  />
                  <Button variant="contained" sx={{ bgcolor: '#444', color: 'white', borderTopLeftRadius: 0, borderBottomLeftRadius: 0, px: 3, '&:hover': { bgcolor: '#222' }, boxShadow: 'none' }}>
                    Áp dụng
                  </Button>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Tạm tính ({cart.reduce((a, b) => a + b.quantity, 0)} sản phẩm)</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatPrice(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Phí vận chuyển</Typography>
                  <Typography variant="body2" fontWeight={600} color="#4caf50">Miễn phí</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Giảm giá</Typography>
                  <Typography variant="body2" fontWeight={600} color="#c62828">- {formatPrice(discount)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3, borderColor: '#eaeaea' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
                <Typography variant="h6" fontWeight={800}>Tổng cộng</Typography>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h4" fontWeight={900} color="#c62828" lineHeight={1}>{formatPrice(total)}</Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>ĐÃ BAO GỒM VAT</Typography>
                </Box>
              </Box>

              <Button
                variant="contained" fullWidth startIcon={<Lock />}
                onClick={handleOpenPayment}
                sx={{
                  bgcolor: '#c62828', py: 2, borderRadius: 2,
                  fontWeight: 800, fontSize: '1.05rem', mb: 3,
                  animation: 'pulseGlow 2.5s 1s infinite',
                  transition: 'all 0.25s ease',
                  '&:hover': { bgcolor: '#b32025', transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(198,40,40,0.4)' }
                }}
              >
                THANH TOÁN NGAY
              </Button>

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, color: '#aaa' }}>
                <LocalAtm fontSize="large" />
                <CreditCard fontSize="large" />
                <AccountBalance fontSize="large" />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Dialog thanh toán */}
        <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ bgcolor: '#c62828', color: 'white' }}>
            <Typography variant="h6">Chọn phương thức thanh toán</Typography>
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
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

              {/* ✅ Form thêm địa chỉ với validate SĐT */}
              {showAddressForm && (
                <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" gutterBottom>➕ Thêm địa chỉ mới</Typography>
                  <TextField
                    fullWidth size="small"
                    label="Họ tên người nhận *"
                    value={newAddress.fullName}
                    onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  {/* ✅ Ô SĐT có validate */}
                  <TextField
                    fullWidth size="small"
                    label="Số điện thoại *"
                    value={newAddress.phone}
                    error={!!cartPhoneError}
                    helperText={cartPhoneError}
                    inputProps={{ maxLength: 10 }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Chỉ cho nhập số
                      setNewAddress({ ...newAddress, phone: value });
                      setCartPhoneError(validatePhone(value));
                    }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth size="small"
                    label="Địa chỉ cụ thể *"
                    value={newAddress.address}
                    onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth size="small"
                    label="Tỉnh/Thành phố"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button variant="outlined" size="small" onClick={() => {
                      setShowAddressForm(false);
                      setCartPhoneError('');
                    }}>Hủy</Button>
                    <Button variant="contained" size="small" onClick={handleAddAddress}
                      disabled={submittingAddress}
                      sx={{ bgcolor: '#c62828' }}>
                      {submittingAddress ? <CircularProgress size={20} /> : 'Lưu địa chỉ'}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Danh sách địa chỉ */}
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
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalAtm />
                    <Typography>Tiền mặt khi nhận hàng (COD)</Typography>
                  </Box>
                }
              />
              <FormControlLabel
                value="banking" control={<Radio />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccountBalance />
                    <Typography>Chuyển khoản ngân hàng / ATM</Typography>
                  </Box>
                }
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
            <Button onClick={() => setOpenPaymentDialog(false)}>Hủy</Button>
            <Button
              onClick={handleCreateOrder}
              variant="contained"
              disabled={loading || userAddresses.length === 0 || (paymentMethod === 'banking' && userBanks.length === 0 && !showBankForm)}
              sx={{ bgcolor: '#c62828', '&:hover': { bgcolor: '#b32025' } }}
            >
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Có thể bạn quan tâm */}
        <Box sx={{ mt: 10 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid #eaeaea', pb: 1, mb: 3 }}>
            <Box>
              <Typography variant="caption" fontWeight={700} color="#c62828" letterSpacing="1px">GỢI Ý</Typography>
              <Typography variant="h5" fontWeight={800} color="#222">Có thể bạn quan tâm</Typography>
            </Box>
            <Button endIcon={<ArrowForward fontSize="small" />} onClick={() => navigate('/products')} sx={{ color: '#222', fontWeight: 600 }}>
              Xem tất cả
            </Button>
          </Box>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)', lg: 'repeat(5, 1fr)' },
            gap: 2
          }}>
            {relatedProducts.map((p, i) => (
              <Box key={p.id} sx={{ animation: `staggerReveal 0.5s ease ${i * 0.06}s both` }}>
                <Card
                  onClick={() => navigate(`/product/${p.id}`)}
                  sx={{
                    cursor: 'pointer', borderRadius: 2, border: 'none',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': { transform: 'translateY(-7px)', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' },
                    '&:hover img': { transform: 'scale(1.06)' }
                  }}
                >
                  <Box sx={{ bgcolor: '#f5f5f5', borderRadius: '8px 8px 0 0', overflow: 'hidden', position: 'relative' }}>
                    <CardMedia component="img" height="180"
                      image={getFirstImage(p.images, 'https://via.placeholder.com/200')}
                      alt={p.name}
                      sx={{ objectFit: 'contain', p: 1.5, transition: 'transform 0.4s ease' }}
                    />
                    {p.isFlashSale && (
                      <Chip label={`-${p.flashSaleDiscount || 0}%`} size="small" sx={{ position: 'absolute', top: 10, left: 10, bgcolor: '#c62828', color: 'white', fontWeight: 700, borderRadius: 1 }} />
                    )}
                  </Box>
                  <CardContent sx={{ p: '12px 14px !important' }}>
                    <Typography variant="body2" noWrap fontWeight={600} sx={{ mb: 0.5, color: '#333' }}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>{p.category || 'Đồ gia dụng'}</Typography>
                    <Box>
                      <Typography variant="body1" color="#c62828" fontWeight={700}>
                        {p.isFlashSale
                          ? formatPrice(p.price * (1 - (p.flashSaleDiscount || 0) / 100))
                          : formatPrice(p.price)}
                      </Typography>
                      {p.isFlashSale && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#9e9e9e' }}>
                          {formatPrice(p.price)}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default CartPage;