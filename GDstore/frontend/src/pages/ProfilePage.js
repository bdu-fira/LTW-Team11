import React, { useState, useEffect } from 'react';
import {
  Container, Paper, Typography, TextField, Button,
  Grid, Box, Avatar, Divider, Alert, Snackbar,
  Card, CardContent, CircularProgress, Chip,
  Tab, Tabs, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, MenuItem, Select,
  List, ListItem, ListItemText, ListItemSecondaryAction,
  RadioGroup, FormControlLabel, Radio, Pagination,
  Stepper, Step, StepLabel, StepContent, StepConnector, stepConnectorClasses, Checkbox
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  Person, Email, Phone, LocationOn, Edit, Save,
  Inventory, ShoppingBag, People, AttachMoney,
  Delete, Add, Visibility, Close, Lock,
  AccountBalance, Home, AddLocation, DeleteOutline,
  CheckCircle, LocalShipping, CheckBox, Cancel,
  Print, CreditCard, ShoppingCart, BarChart, VerifiedUser, OpenInNew, MoreVert
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { getFirstImage } from '../utils/imageUtils';

// ✅ Validate SĐT: bắt đầu bằng 0, đúng 10 số
const phoneRegex = /^0\d{9}$/;
const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Vui lòng nhập số điện thoại';
  if (!phoneRegex.test(phone)) return 'Số điện thoại phải bắt đầu bằng 0 và đủ 10 chữ số';
  return '';
};

const BANK_OPTIONS = [
  'Vietcombank',
  'BIDV',
  'VietinBank',
  'Agribank',
  'Techcombank',
  'MB Bank',
  'ACB',
  'TPBank',
  'VPBank',
  'Sacombank',
  'HDBank',
  'SHB',
  'SeABank',
  'VIB',
  'OCB',
  'MSB'
];

const ProfilePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    gender: 'Khác',
    dateOfBirth: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordAlert, setPasswordAlert] = useState({ show: false, type: '', text: '' });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Cancel order dialog states
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [canceling, setCanceling] = useState(false);

  // Order Details states
  const [openOrderDetailsDialog, setOpenOrderDetailsDialog] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);

  const cancelReasons = [
    'Đơn hàng bị nhầm, muốn đặt lại',
    'Thay đổi địa chỉ giao hàng',
    'Sản phẩm không còn nhu cầu sử dụng',
  ];

  // Address states
  const [addresses, setAddresses] = useState([]);
  const [openAddressDialog, setOpenAddressDialog] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    district: '',
    ward: '',
    isDefault: false
  });

  // Shipper Registration states
  const [openShipperDialog, setOpenShipperDialog] = useState(false);
  const [shipperForm, setShipperForm] = useState({
    cccd: '',
    vehicleType: '',
    licensePlate: '',
    area: ''
  });

  // ✅ Lỗi SĐT cho từng form
  const [profilePhoneError, setProfilePhoneError] = useState('');
  const [addressPhoneError, setAddressPhoneError] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPhone, setIsEditingPhone] = useState(false);

  // Bank states
  const [banks, setBanks] = useState([]);
  const [openBankDialog, setOpenBankDialog] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankForm, setBankForm] = useState({
    bankName: '',
    accountNumber: '',
    accountName: '',
    branchName: '',
    linkedPhone: '',
    identityNumber: '',
    otpCode: '',
    agreeBankTerms: false,
    isDefault: false
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        province: user.province || '',
        gender: user.gender || 'Khác',
        dateOfBirth: user.dateOfBirth || '2000-01-01'
      });
      fetchOrders();
      fetchAddresses();
      fetchBanks();
    }
  }, [user]);

  // ========== API CALLS ==========
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data } = await API.get('/orders');
      setOrders(data || []);
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await API.get('/users/addresses');
      setAddresses(data || []);
    } catch (error) {
      console.error('Lỗi tải địa chỉ:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const { data } = await API.get('/users/banks');
      setBanks(data || []);
    } catch (error) {
      console.error('Lỗi tải ngân hàng:', error);
    }
  };

  // ========== UPDATE PROFILE ==========
  const handleProfileUpdate = async (e) => {
    e.preventDefault();

    // ✅ Validate SĐT profile trước khi lưu
    if (profile.phone) {
      const phoneErr = validatePhone(profile.phone);
      if (phoneErr) {
        setProfilePhoneError(phoneErr);
        return;
      }
    }

    setSaving(true);
    try {
      await API.put('/users/profile', profile);
      updateUser(profile);
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công!' });
      setProfilePhoneError('');
      setEditMode(false);
      setIsEditingEmail(false);
      setIsEditingPhone(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Cập nhật thất bại!' });
    } finally {
      setSaving(false);
    }
  };

  // ========== UPLOAD AVATAR ==========
  const handleUploadAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setMessage({ type: 'error', text: 'Chỉ chấp nhận file dưới 1MB!' });
      return;
    }
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const { data } = await API.post('/users/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (data.success) {
        updateUser({ avatarUrl: data.avatarUrl });
        setMessage({ type: 'success', text: 'Cập nhật ảnh thành công!' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi tải ảnh lên!' });
    }
  };

  // ========== ĐĂNG KÝ SHIPPER ==========
  const handleRegisterShipper = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.post('/users/register-shipper', shipperForm);
      updateUser({ shipperRegistrationStatus: 'pending' });
      setMessage({ type: 'success', text: data.message || 'Gửi yêu cầu đăng ký Shipper thành công!' });
      setOpenShipperDialog(false);
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi gửi yêu cầu đăng ký' });
    } finally {
      setSaving(false);
    }
  };

  // ========== CHANGE PASSWORD ==========
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordAlert({ show: false, type: '', text: '' });
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordAlert({ show: true, type: 'error', text: 'Mật khẩu xác nhận không khớp!' });
      return;
    }
    if (passwordForm.new.length < 6) {
      setPasswordAlert({ show: true, type: 'error', text: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
      return;
    }
    setPasswordLoading(true);
    try {
      await API.put('/users/password', {
        currentPassword: passwordForm.current,
        newPassword: passwordForm.new
      });
      setPasswordAlert({ show: true, type: 'success', text: '✅ Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập tiếp theo.' });
      setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!';
      setPasswordAlert({ show: true, type: 'error', text: '❌ ' + msg });
      setMessage({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ========== CANCEL ORDER ==========
  const handleOpenCancelDialog = (order) => {
    setSelectedOrder(order);
    setCancelReason('');
    setOtherReason('');
    setOpenCancelDialog(true);
  };

  const handleOpenOrderDetails = (order) => {
    setSelectedOrderDetails(order);
    setOpenOrderDetailsDialog(true);
  };

  const handleCancelOrderWithReason = async () => {
    let finalReason = cancelReason;
    if (cancelReason === 'other') {
      if (!otherReason.trim()) {
        setMessage({ type: 'error', text: 'Vui lòng nhập lý do hủy đơn hàng' });
        return;
      }
      finalReason = otherReason;
    } else if (!cancelReason) {
      setMessage({ type: 'error', text: 'Vui lòng chọn lý do hủy đơn hàng' });
      return;
    }
    setCanceling(true);
    try {
      await API.put(`/orders/${selectedOrder.id}/cancel`, { reason: finalReason });
      setMessage({ type: 'success', text: 'Hủy đơn hàng thành công!' });
      setOpenCancelDialog(false);
      fetchOrders();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Không thể hủy đơn hàng' });
    } finally {
      setCanceling(false);
    }
  };

  // ========== ADDRESS FUNCTIONS ==========
  const handleOpenAddressDialog = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        fullName: address.fullName || profile.name,
        phone: address.phone || profile.phone,
        address: address.address || '',
        city: address.city || '',
        district: address.district || '',
        ward: address.ward || '',
        isDefault: address.isDefault || false
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        fullName: profile.name || '',
        phone: profile.phone || '',
        address: '',
        city: '',
        district: '',
        ward: '',
        isDefault: addresses.length === 0
      });
    }
    setAddressPhoneError('');
    setOpenAddressDialog(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.fullName || !addressForm.address) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
      return;
    }

    // ✅ Validate SĐT trong form địa chỉ
    const phoneErr = validatePhone(addressForm.phone);
    if (phoneErr) {
      setAddressPhoneError(phoneErr);
      return;
    }

    try {
      if (editingAddress) {
        await API.put(`/users/addresses/${editingAddress.id}`, addressForm);
        setMessage({ type: 'success', text: 'Cập nhật địa chỉ thành công' });
      } else {
        await API.post('/users/addresses', addressForm);
        setMessage({ type: 'success', text: 'Thêm địa chỉ thành công' });
      }
      setAddressPhoneError('');
      setOpenAddressDialog(false);
      fetchAddresses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi lưu địa chỉ' });
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
      try {
        await API.delete(`/users/addresses/${addressId}`);
        setMessage({ type: 'success', text: 'Xóa địa chỉ thành công' });
        fetchAddresses();
      } catch (error) {
        setMessage({ type: 'error', text: 'Lỗi xóa địa chỉ' });
      }
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      await API.put(`/users/addresses/${addressId}/default`);
      setMessage({ type: 'success', text: 'Đặt làm địa chỉ mặc định' });
      fetchAddresses();
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi cập nhật' });
    }
  };

  // ========== BANK FUNCTIONS ==========
  const handleOpenBankDialog = (bank = null) => {
    if (bank) {
      setEditingBank(bank);
      setBankForm({
        bankName: bank.bankName || '',
        accountNumber: bank.accountNumber || '',
        accountName: bank.accountName || profile.name,
        branchName: bank.branchName || '',
        linkedPhone: bank.linkedPhone || profile.phone || '',
        identityNumber: bank.identityNumber || '',
        agreeBankTerms: true,
        isDefault: bank.isDefault || false
      });
    } else {
      setEditingBank(null);
      setBankForm({
        bankName: '',
        accountNumber: '',
        accountName: profile.name || '',
        branchName: '',
        linkedPhone: profile.phone || '',
        identityNumber: '',
        agreeBankTerms: false,
        isDefault: banks.length === 0
      });
    }
    setOpenBankDialog(true);
  };

  const handleSaveBank = async () => {
    try {
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

      const payload = {
        bankName: bankForm.bankName,
        accountNumber: bankForm.accountNumber,
        accountName: bankForm.accountName,
        isDefault: bankForm.isDefault
      };

      if (editingBank) {
        await API.put(`/users/banks/${editingBank.id}`, payload);
        setMessage({ type: 'success', text: 'Cập nhật ngân hàng thành công' });
      } else {
        await API.post('/users/banks', payload);
        setMessage({ type: 'success', text: 'Thêm ngân hàng thành công' });
      }
      setOpenBankDialog(false);
      fetchBanks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi lưu ngân hàng' });
    }
  };

  const handleDeleteBank = async (bankId) => {
    if (window.confirm('Bạn có chắc muốn xóa tài khoản ngân hàng này?')) {
      try {
        await API.delete(`/users/banks/${bankId}`);
        setMessage({ type: 'success', text: 'Xóa ngân hàng thành công' });
        fetchBanks();
      } catch (error) {
        setMessage({ type: 'error', text: 'Lỗi xóa ngân hàng' });
      }
    }
  };

  const handleSetDefaultBank = async (bankId) => {
    try {
      await API.put(`/users/banks/${bankId}/default`);
      setMessage({ type: 'success', text: 'Đặt làm tài khoản mặc định' });
      fetchBanks();
    } catch (error) {
      setMessage({ type: 'error', text: 'Lỗi cập nhật' });
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price).replace('₫', 'đ');
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending:            '⏳ Chờ xử lý',
      processing:         '🔄 Đang xử lý',
      shipped:            '📦 Chờ shipper nhận',
      out_for_delivery:   '🚚 Đang giao',
      delivery_confirmed: '⏳ Chờ xác nhận',
      delivered:          '✅ Đã giao',
      cancelled:          '❌ Đã hủy'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':            return '#ff9800';
      case 'processing':         return '#2196f3';
      case 'shipped':            return '#6366f1';
      case 'out_for_delivery':   return '#7c3aed';
      case 'delivery_confirmed': return '#d97706';
      case 'delivered':          return '#4caf50';
      case 'cancelled':          return '#f44336';
      default:                   return '#999';
    }
  };

  const dobParts = profile.dateOfBirth ? profile.dateOfBirth.split('-') : ['2000', '01', '01'];
  const handleDateChange = (field, value) => {
    let newParts = [...dobParts];
    if (field === 'year') newParts[0] = value;
    if (field === 'month') newParts[1] = value;
    if (field === 'day') newParts[2] = value;
    setProfile({ ...profile, dateOfBirth: newParts.join('-') });
  };

  const menuItems = [
    { icon: <Person />, label: 'Hồ Sơ', tab: 0 },
    { icon: <LocationOn />, label: 'Địa Chỉ', tab: 4 },
    { icon: <AccountBalance />, label: 'Ngân Hàng', tab: 5 },
    { icon: <Lock />, label: 'Đổi Mật Khẩu', tab: 6 },
    { icon: <ShoppingBag />, label: 'Đơn Mua', tab: 7 },
  ];

  const handleMenuClick = (tab) => {
    setTabValue(tab);
    if (tab === 4) fetchAddresses();
    if (tab === 5) fetchBanks();
    if (tab === 7) fetchOrders();
  };

  if (!user) {
    return (
      <Container sx={{ textAlign: 'center', py: 8 }}>
        <Typography>Vui lòng đăng nhập để xem hồ sơ</Typography>
        <Button href="/login" variant="contained" sx={{ mt: 2 }}>Đăng nhập</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 1.5, md: 4 }, mb: { xs: 2, md: 4 }, px: { xs: 1.5, md: 3 } }}>
      <Snackbar open={message.text !== ''} autoHideDuration={3000} onClose={() => setMessage({ type: '', text: '' })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={message.type || 'info'} onClose={() => setMessage({ type: '', text: '' })}>{message.text}</Alert>
      </Snackbar>

      <Grid container spacing={{ xs: 2, md: 6 }} sx={{ flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
        
        {/* ===================== SIDEBAR ===================== */}
        <Grid item sx={{ width: { xs: '100%', md: '280px' }, flexShrink: 0, borderRight: { md: '1px solid #f9f9f9' }, minHeight: { md: '80vh' }, pr: { md: 2 } }}>
           <Typography variant="h5" fontWeight={800} color="#1a1a1a" sx={{ mb: 6, px: 3, display: { xs: 'none', md: 'block' }, lineHeight: 1.2 }}>
             Trang cá nhân
           </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'row', md: 'column' }, gap: 1, overflowX: { xs: 'auto', md: 'visible' }, pb: { xs: 1, md: 0 }, pr: { xs: 0.5, md: 0 } }}>
            {menuItems.map((item, idx) => {
              const active = tabValue === item.tab;
              return (
                <Box key={idx} onClick={() => handleMenuClick(item.tab)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2.5 }, cursor: 'pointer',
                    color: active ? '#b71c1c' : '#555',
                    fontWeight: active ? 700 : 500,
                    bgcolor: active ? '#fff5f5' : 'transparent',
                    borderRight: { xs: 'none', md: active ? '5px solid #b71c1c' : '5px solid transparent' },
                    borderBottom: { xs: active ? '2px solid #b71c1c' : '2px solid transparent', md: 'none' },
                    borderTopLeftRadius: { xs: '14px', md: '32px' },
                    borderBottomLeftRadius: { xs: '14px', md: '32px' },
                    borderTopRightRadius: { xs: '14px', md: 0 },
                    borderBottomRightRadius: { xs: '14px', md: 0 },
                    py: { xs: 1, md: 2 }, pl: { xs: 1.5, md: 4 }, pr: { xs: 1.5, md: 1 },
                    minWidth: { xs: 'fit-content', md: 'unset' },
                    flexShrink: 0,
                    transition: 'all 0.2s',
                    '&:hover': { color: '#b71c1c', bgcolor: active ? '#fff5f5' : '#fafafa' }
                  }}
                >
                  {React.cloneElement(item.icon, { sx: { fontSize: isMobile ? 18 : 24 } })}
                  <Typography sx={{ fontSize: { xs: '0.82rem', md: '15px' }, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</Typography>
                </Box>
              );
            })}
            
            <Box sx={{ mt: { xs: 0, md: 'auto' }, pt: { xs: 0, md: 8 }, ml: { xs: 'auto', md: 0 }, flexShrink: 0 }}>
              <Box onClick={logout} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, cursor: 'pointer', color: '#555', py: 2, pl: 4, '&:hover': { color: '#b71c1c' } }}>
                <Close sx={{ fontSize: 24 }} />
                <Typography sx={{ fontSize: { xs: '0.82rem', md: '15px' }, fontWeight: 500, whiteSpace: 'nowrap' }}>Đăng Xuất</Typography>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* ===================== MAIN CONTENT ===================== */}
        <Grid item sx={{ flexGrow: 1, minWidth: 0, width: { xs: '100%', md: 'calc(100% - 280px)' }, mb: 4 }}>
          
          {/* HEADER ROW FOR ALL TABS */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2.5, md: 4 }, pb: { xs: 0.5, md: 2 } }}>
             <Box>
                <Typography variant="h5" fontWeight={800} color="#1a1a1a" sx={{ fontSize: { xs: '1.9rem', md: '1.5rem' }, lineHeight: 1.15 }}>
                  {tabValue === 0 && "Hồ Sơ Của Tôi"}
                  {tabValue === 4 && "Sổ địa chỉ"}
                  {tabValue === 5 && "Tài khoản ngân hàng"}
                  {tabValue === 6 && "Đổi Mật Khẩu"}
                  {tabValue === 7 && "Đơn hàng của tôi"}
                </Typography>
                <Typography variant="body2" color="#666" sx={{ mt: 1, fontSize: { xs: '0.9rem', md: '0.875rem' } }}>
                  {tabValue === 0 && "Quản lý thông tin hồ sơ để bảo mật tài khoản"}
                  {tabValue === 4 && "Quản lý thông tin giao hàng và địa chỉ liên lạc của bạn."}
                  {tabValue === 5 && "Quản lý các phương thức thanh toán và tài khoản thụ hưởng của bạn."}
                  {tabValue === 6 && "Để bảo mật tài khoản, vui lòng không chia sẻ mật khẩu cho người khác"}
                  {tabValue === 7 && "Theo dõi trạng thái và lịch sử các đơn hàng của bạn"}
                </Typography>
             </Box>
             {/* Add Address button in header */}
             {tabValue === 4 && (
               <Button
                 onClick={() => handleOpenAddressDialog()}
                 variant="contained"
                 startIcon={<Add />}
                 sx={{
                   bgcolor: '#b71c1c', color: 'white', borderRadius: '12px',
                   px: 2.5, py: 1, fontWeight: 700, fontSize: '0.85rem',
                   textTransform: 'none', boxShadow: 'none', flexShrink: 0,
                   '&:hover': { bgcolor: '#8b0000', boxShadow: 'none' }
                 }}
               >
                 Thêm địa chỉ
               </Button>
             )}
          </Box>

          {/* TAB 0 - PROFILE */}
          {tabValue === 0 && (
            <>
            {/* White Card wrapper */}
            <Box sx={{ bgcolor: 'white', borderRadius: { xs: '20px', md: '32px' }, p: { xs: 2.5, md: 6 }, mb: 4, display: 'flex', flexDirection: { xs: 'column-reverse', md: 'row' }, gap: { xs: 2.5, md: 6 }, border: '1px solid #f9f9f9' }}>
               
               {/* Left Fields */}
               <Box sx={{ flex: 1 }}>
                  <form onSubmit={handleProfileUpdate}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      
                      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0.8, md: 0 } }}>
                        <Typography sx={{ width: { xs: '100%', md: '150px' }, fontSize: '14px', color: '#555', fontWeight: 500, textAlign: { xs: 'left', md: 'right' }, pr: { xs: 0, md: 4 } }}>Tên đăng nhập</Typography>
                        <TextField size="small" fullWidth value={user.email?.split('@')[0]} disabled sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', border: 'none', '& fieldset': { border: 'none' } } }} />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0.8, md: 0 } }}>
                        <Typography sx={{ width: { xs: '100%', md: '150px' }, fontSize: '14px', color: '#555', fontWeight: 500, textAlign: { xs: 'left', md: 'right' }, pr: { xs: 0, md: 4 } }}>Tên</Typography>
                        <TextField size="small" fullWidth value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', border: 'none', '& fieldset': { border: 'none' } } }} />
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0.8, md: 0 } }}>
                        <Typography sx={{ width: { xs: '100%', md: '150px' }, fontSize: '14px', color: '#555', fontWeight: 500, textAlign: { xs: 'left', md: 'right' }, pr: { xs: 0, md: 4 } }}>Email</Typography>
                        {isEditingEmail ? (
                          <TextField size="small" fullWidth value={profile.email} onChange={(e) => setProfile({...profile, email: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', border: 'none', '& fieldset': { border: 'none' } } }} />
                        ) : (
                          <Typography sx={{ flex: 1, fontSize: '15px', color: '#333' }}>
                            {profile.email?.replace(/(\w{2})[\w.-]+@([\w.]+\w)/, "$1***@$2")} 
                            <span style={{color:'#b71c1c', fontSize:'13px', cursor:'pointer', marginLeft:'12px'}} onClick={() => setIsEditingEmail(true)}>Thay đổi</span>
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0.8, md: 0 } }}>
                        <Typography sx={{ width: { xs: '100%', md: '150px' }, fontSize: '14px', color: '#555', fontWeight: 500, textAlign: { xs: 'left', md: 'right' }, pr: { xs: 0, md: 4 } }}>Số điện thoại</Typography>
                        {isEditingPhone ? (
                          <TextField size="small" fullWidth value={profile.phone} error={!!profilePhoneError} helperText={profilePhoneError} onChange={(e) => setProfile({...profile, phone: e.target.value.replace(/\D/g, '')})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', border: 'none', '& fieldset': { border: 'none' } } }} />
                        ) : (
                          <Typography sx={{ flex: 1, fontSize: '15px', color: '#333' }}>
                            {profile.phone ? `********${profile.phone.slice(-2)}` : 'Chưa cập nhật'}
                            <span style={{color:'#b71c1c', fontSize:'13px', cursor:'pointer', marginLeft:'12px'}} onClick={() => setIsEditingPhone(true)}>Thay đổi</span>
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0.8, md: 0 } }}>
                         <Typography sx={{ width: { xs: '100%', md: '150px' }, fontSize: '14px', color: '#555', fontWeight: 500, textAlign: { xs: 'left', md: 'right' }, pr: { xs: 0, md: 4 } }}>Giới tính</Typography>
                         <Box sx={{ display: 'flex', gap: { xs: 0.5, md: 3 }, flexWrap: 'wrap' }}>
                           {['Nam', 'Nữ', 'Khác'].map(g => (
                             <FormControlLabel key={g} control={<Radio size="small" checked={profile.gender === g} onChange={() => setProfile({...profile, gender: g})} sx={{color: profile.gender === g ? '#b71c1c' : '#ccc', '&.Mui-checked': {color: '#b71c1c'}}} />} label={<Typography fontSize="14px">{g}</Typography>} />
                           ))}
                         </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 0.8, md: 0 } }}>
                         <Typography sx={{ width: { xs: '100%', md: '150px' }, fontSize: '14px', color: '#555', fontWeight: 500, textAlign: { xs: 'left', md: 'right' }, pr: { xs: 0, md: 4 } }}>Ngày sinh</Typography>
                         <Box sx={{ display: 'flex', gap: 1.5, flex: 1, width: '100%' }}>
                           <Select size="small" value={dobParts[2]} onChange={e => handleDateChange('day', e.target.value)} sx={{ flex: 1, bgcolor: '#fce4e4', borderRadius: '12px', '& .MuiOutlinedInput-notchedOutline': {border: 'none'} }}>
                             {Array.from({length: 31}, (_,i) => <MenuItem key={i} value={String(i+1).padStart(2,'0')}>{String(i+1).padStart(2,'0')}</MenuItem>)}
                           </Select>
                           <Select size="small" value={dobParts[1]} onChange={e => handleDateChange('month', e.target.value)} sx={{ flex: 1, bgcolor: '#fce4e4', borderRadius: '12px', '& .MuiOutlinedInput-notchedOutline': {border: 'none'} }}>
                             {Array.from({length: 12}, (_,i) => <MenuItem key={i} value={String(i+1).padStart(2,'0')}>Tháng {i+1}</MenuItem>)}
                           </Select>
                           <Select size="small" value={dobParts[0]} onChange={e => handleDateChange('year', e.target.value)} sx={{ flex: 1, bgcolor: '#fce4e4', borderRadius: '12px', '& .MuiOutlinedInput-notchedOutline': {border: 'none'} }}>
                             {Array.from({length: 100}, (_,i) => <MenuItem key={i} value={String(new Date().getFullYear() - i)}>{new Date().getFullYear() - i}</MenuItem>)}
                           </Select>
                         </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1.2, ml: { xs: 0, md: '150px' }, pl: { xs: 0, md: 4 }, mt: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                        <Button type="submit" variant="contained" disabled={saving} sx={{ bgcolor: '#b71c1c', color: 'white', borderRadius: '12px', px: 4, py: 1.5, fontWeight: 700, textTransform: 'none', width: { xs: '100%', md: 'auto' }, '&:hover': {bgcolor: '#8b0000'} }}>Lưu</Button>
                        <Button variant="contained" onClick={() => setTabValue(6)} sx={{ bgcolor: '#faebeb', color: '#333', borderRadius: '12px', px: 4, py: 1.5, fontWeight: 700, textTransform: 'none', boxShadow: 'none', width: { xs: '100%', md: 'auto' }, '&:hover': {bgcolor: '#f5dfdf', boxShadow: 'none'} }}>Cập nhật mật khẩu</Button>
                      </Box>
                    </Box>
                  </form>
               </Box>

               {/* Right Avatar */}
               <Box sx={{ width: { xs: '100%', md: '250px' }, borderLeft: { xs: 'none', md: '1px solid #f9f9f9' }, borderBottom: { xs: '1px solid #f9f9f9', md: 'none' }, pb: { xs: 2.5, md: 0 }, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Box sx={{ position: 'relative', mb: 3 }}>
                     <Box sx={{ width: 140, height: 140, borderRadius: '50%', border: '4px solid #fce4e4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', p: 1 }}>
                        <Avatar src={user.avatarUrl} sx={{ width: '100%', height: '100%', bgcolor: '#f0f0f0' }} />
                     </Box>
                     <Box sx={{ position: 'absolute', bottom: 0, right: 0, bgcolor: '#b71c1c', p: 1, borderRadius: '50%', color: 'white', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Edit sx={{ fontSize: 16 }} />
                     </Box>
                  </Box>
                  
                  <input accept="image/jpeg, image/png" style={{ display: 'none' }} id="avatar-upload" type="file" onChange={handleUploadAvatar} />
                  <label htmlFor="avatar-upload">
                    <Button variant="outlined" component="span" sx={{ borderRadius: '10px', textTransform: 'none', borderColor: '#e0e0e0', color: '#555', px: 4, mb: 1 }}>Chọn ảnh</Button>
                  </label>
                  <Typography variant="caption" color="text.secondary" align="center" display="block">Dung lượng file tối đa 1 MB<br/>Định dạng: .JPEG, .PNG</Typography>
               </Box>
            </Box>

             {/* 3 Status Cards Area */}
             <Grid container spacing={3}>
                {[
                  { title: "Tài khoản xác minh", desc: "Thông tin của bạn đã được bảo mật", icon: <CheckCircle sx={{color:'#b71c1c'}}/> },
                  { title: "Lịch sử đăng nhập", desc: "Kiểm tra các hoạt động gần đây", icon: <AccountBalance sx={{color:'#b71c1c'}}/> },
                  { title: "Cài đặt thông báo", desc: "Tùy chỉnh nhận tin tức & cập nhật", icon: <LocationOn sx={{color:'#b71c1c'}}/> }
                ].map((c, i) => (
                  <Grid item xs={12} md={4} key={i}>
                    <Box sx={{ bgcolor: '#fff9f9', p: 3, borderRadius: '24px', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                       <Box sx={{ p: 1.5, bgcolor: '#fce4e4', borderRadius: '50%' }}>{c.icon}</Box>
                       <Box>
                          <Typography variant="subtitle2" fontWeight={800} color="#333" mb={0.5}>{c.title}</Typography>
                          <Typography variant="caption" color="#777" display="block" sx={{ lineHeight: 1.5 }}>{c.desc}</Typography>
                       </Box>
                    </Box>
                  </Grid>
                ))}
             </Grid>

             {/* Đăng ký làm Shipper Card */}
             {user?.role !== 'shipper' && user?.role !== 'admin' && (
                <Box sx={{ mt: 3, p: 3, bgcolor: '#fff0f0', borderRadius: '24px', border: '1px dashed #b71c1c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: { xs: 'column', md: 'row' }, gap: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={800} color="#b71c1c">Trở thành đối tác Shipper</Typography>
                    <Typography variant="body2" color="#666" mt={0.5}>Gia nhập đội ngũ vận chuyển của GD Store để gia tăng thu nhập của bạn.</Typography>
                  </Box>
                  {user?.shipperRegistrationStatus === 'pending' ? (
                    <Button disabled variant="contained" sx={{ bgcolor: '#ccc', color: '#555', borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, textTransform: 'none', '&.Mui-disabled': { bgcolor: '#e0e0e0' } }}>
                      Đang chờ Admin duyệt
                    </Button>
                  ) : user?.shipperRegistrationStatus === 'rejected' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                      <Typography variant="caption" color="error" fontWeight="bold">Hồ sơ đã bị từ chối</Typography>
                      <Button onClick={() => setOpenShipperDialog(true)} variant="contained" sx={{ bgcolor: '#b71c1c', color: 'white', borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, textTransform: 'none', '&:hover': {bgcolor: '#8b0000'} }}>
                        Đăng ký lại
                      </Button>
                    </Box>
                  ) : (
                    <Button onClick={() => setOpenShipperDialog(true)} variant="contained" sx={{ bgcolor: '#b71c1c', color: 'white', borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, textTransform: 'none', '&:hover': {bgcolor: '#8b0000'} }}>
                      Đăng ký làm Shipper
                    </Button>
                  )}
                </Box>
             )}
             </>
          )}

          {/* TAB 6 - PASSWORD */}
          {tabValue === 6 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={7}>
                 <Box sx={{ bgcolor: 'white', borderRadius: '32px', p: 5, border: '1px solid #f9f9f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
                   <form onSubmit={handlePasswordChange}>
                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                       <Box>
                         <Typography variant="body2" fontWeight={700} mb={1.5} color="#555">Mật khẩu hiện tại</Typography>
                         <TextField fullWidth type="password" placeholder="••••••••••••" value={passwordForm.current} onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', '& fieldset': {border: 'none'} } }} />
                         <Typography variant="caption" color="text.secondary" display="block" mt={1}>Quên mật khẩu? <span style={{color:'#b71c1c', fontWeight:700, cursor:'pointer'}}>Reset here</span>.</Typography>
                       </Box>
                       
                       <Box>
                         <Typography variant="body2" fontWeight={700} mb={1.5} color="#555">Mật khẩu mới</Typography>
                         <TextField fullWidth type="password" placeholder="Tối thiểu 12 ký tự" value={passwordForm.new} onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', '& fieldset': {border: 'none'} } }} />
                       </Box>

                       <Box>
                         <Typography variant="body2" fontWeight={700} mb={1.5} color="#555">Confirm Mật khẩu mới</Typography>
                         <TextField fullWidth type="password" placeholder="Nhập lại mật khẩu mới" value={passwordForm.confirm} onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#fce4e4', borderRadius: '12px', '& fieldset': {border: 'none'} } }} />
                       </Box>

                       {passwordAlert.show && (
                          <Alert
                            severity={passwordAlert.type}
                            onClose={() => setPasswordAlert({ show: false, type: '', text: '' })}
                            sx={{ borderRadius: '12px', fontWeight: 600, fontSize: '0.875rem', '& .MuiAlert-message': { lineHeight: 1.6 } }}
                          >
                            {passwordAlert.text}
                          </Alert>
                       )}

                       <Button
                          type="submit"
                          variant="contained"
                          disabled={passwordLoading}
                          sx={{ bgcolor: '#b71c1c', color: 'white', borderRadius: '12px', py: 1.8, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: '#8b0000' }, '&.Mui-disabled': { bgcolor: '#e57373', color: 'white' } }}
                        >
                          {passwordLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                       </Button>
                     </Box>
                   </form>
                 </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                 <Box sx={{ bgcolor: '#fff9f9', borderRadius: '32px', p: 4, mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                       <Box sx={{ bgcolor: '#fce4e4', p: 1, borderRadius: '50%' }}><Lock sx={{color: '#b71c1c'}} /></Box>
                       <Typography variant="subtitle1" fontWeight={700}>Tiêu chuẩn Bảo mật</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                       <Typography variant="body2" color="#555" display="flex" gap={1.5}><CheckCircle sx={{color:'#1976d2', fontSize:18}}/> Ít nhất 12 ký tự (càng dài càng tốt)</Typography>
                       <Typography variant="body2" color="#555" display="flex" gap={1.5}><CheckCircle sx={{color:'#1976d2', fontSize:18}}/> Kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt</Typography>
                       <Typography variant="body2" color="#aaa" display="flex" gap={1.5}><CheckCircle sx={{color:'#ddd', fontSize:18}}/> Tránh sử dụng từ phổ biến hoặc thông tin cá nhân</Typography>
                    </Box>
                 </Box>

                 <Box sx={{ bgcolor: '#fff5f5', borderRadius: '32px', p: 4, mb: 3, position: 'relative', overflow: 'hidden' }}>
                    <Typography variant="subtitle1" fontWeight={800} color="#b71c1c" mb={1}>Cần hỗ trợ?</Typography>
                    <Typography variant="body2" color="#555" mb={3} sx={{ position: 'relative', zIndex: 1 }}>Liên hệ bộ phận kỹ thuật để được hỗ trợ quản lý tài khoản.</Typography>
                    <Typography variant="caption" fontWeight={700} color="#b71c1c" sx={{ cursor:'pointer' }}>Gửi yêu cầu hỗ trợ →</Typography>
                    <Lock sx={{ position: 'absolute', right: -20, bottom: -20, fontSize: 120, color: '#fce4e4', opacity: 0.5 }} />
                 </Box>

                 <Box sx={{ bgcolor: '#fafafa', borderRadius: '32px', p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">CẬP NHẬT GẦN NHẤT</Typography>
                      <Typography variant="subtitle2" fontWeight={800}>Hôm nay</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                       <Typography variant="caption" color="text.secondary" display="block">PHIÊN ĐĂNG NHẬP</Typography>
                       <Chip label="AN TOÀN" size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 800, fontSize: '10px' }} />
                    </Box>
                 </Box>
              </Grid>
            </Grid>
          )}
          
          {/* TAB 5 - BANKS */}
          {tabValue === 5 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Grid container spacing={3}>
                  {banks.map((bank, index) => (
                    <Grid item xs={12} md={6} key={bank.id}>
                      <Box sx={{ 
                        bgcolor: 'white', borderRadius: '16px', p: 3, height: '100%', 
                        position: 'relative', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        borderLeft: '6px solid #b71c1c', overflow: 'hidden'
                      }}>
                         {/* Faint Bank Building Illustration */}
                         <Box sx={{ position: 'absolute', right: -20, top: 20, opacity: 0.1 }}>
                            <AccountBalance sx={{ fontSize: 100 }} />
                         </Box>
                         
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, position: 'relative', zIndex: 1 }}>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                               <Box sx={{ width: 50, height: 50, bgcolor: '#f0f0f0', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                 <Typography variant="h6" fontWeight={900} color="#b71c1c">{bank.bankName.substring(0,2).toUpperCase() || 'MB'}</Typography>
                               </Box>
                               <Box>
                                 <Typography variant="subtitle1" fontWeight={800} color="#111">{bank.bankName}</Typography>
                                 <Typography variant="caption" color="text.secondary" fontWeight={600} letterSpacing={0.5}>THẺ GHI NỢ NỘI ĐỊA</Typography>
                               </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                               <IconButton onClick={() => handleOpenBankDialog(bank)} size="small" sx={{ color: '#555' }}><Edit fontSize="small" /></IconButton>
                               <IconButton onClick={() => handleDeleteBank(bank.id)} size="small" sx={{ color: '#555' }}><Delete fontSize="small" /></IconButton>
                            </Box>
                         </Box>

                         <Box sx={{ position: 'relative', zIndex: 1 }}>
                            <Typography variant="h5" sx={{ fontFamily: 'monospace', fontWeight: 800, letterSpacing: 3, color: '#111', mb: 1 }}>
                              **** **** {bank.accountNumber.slice(-4) || '5656'}
                            </Typography>
                            <Typography variant="body2" color="#555" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                              {bank.accountName}
                            </Typography>
                         </Box>
                      </Box>
                    </Grid>
                  ))}
                  
                  {/* Add New Bank Account */}
                  <Grid item xs={12} md={6}>
                     <Box onClick={() => handleOpenBankDialog()} sx={{ 
                        bgcolor: '#fafafa', borderRadius: '16px', border: '2px dashed #e0e0e0', p: 3, 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
                        height: '100%', minHeight: 200, cursor: 'pointer', transition: 'all 0.2s',
                        '&:hover': { bgcolor: '#f5f5f5', borderColor: '#b71c1c' } 
                     }}>
                        <Box sx={{ width: 50, height: 50, bgcolor: '#f0f0f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                           <Add sx={{ fontSize: 24, color: '#555' }} />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#333">Thêm tài khoản mới</Typography>
                     </Box>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}

          {/* TAB 4 - ADDRESSES */}
          {tabValue === 4 && (
            <Paper sx={{ borderRadius: '24px', overflow: 'hidden' }}>
              {/* Header inside paper */}
              <Box sx={{ p: 3, borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={800}>📍 Địa chỉ của tôi</Typography>
                  <Typography variant="caption" color="text.secondary">Tổng {addresses.length} địa chỉ</Typography>
                </Box>
              </Box>

              {addresses.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography fontSize={48}>📭</Typography>
                  <Typography variant="h6" fontWeight={700} mt={1}>Chưa có địa chỉ nào</Typography>
                  <Typography variant="body2" color="text.secondary">Hãy thêm địa chỉ giao hàng để mua sắm dễ dàng hơn!</Typography>
                </Box>
              ) : (
                <Box>
                  {addresses.map((addr, idx) => (
                    <Box key={addr.id} sx={{ p: 3, borderBottom: idx < addresses.length - 1 ? '1px solid #f9f9f9' : 'none' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                        {/* Left info */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>ĐỊA CHỈ GIAO HÀNG</Typography>
                            {addr.isDefault && <Chip label="MẶC ĐỊNH" size="small" sx={{ bgcolor: '#fce4e4', color: '#b71c1c', fontWeight: 800, fontSize: '0.62rem', borderRadius: '4px', height: 20 }} />}
                          </Box>
                          <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>{addr.fullName}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.5 }}>
                            <Phone sx={{ color: '#aaa', fontSize: 14 }} />
                            <Typography variant="caption" color="text.secondary">{addr.phone}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.8, mt: 0.5 }}>
                            <LocationOn sx={{ color: '#aaa', fontSize: 14, mt: 0.2, flexShrink: 0 }} />
                            <Typography variant="caption" color="text.secondary">
                              {[addr.address, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                            </Typography>
                          </Box>
                        </Box>
                        {/* Right actions */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                          {!addr.isDefault && (
                            <Button size="small" variant="outlined"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              sx={{ fontWeight: 700, fontSize: '0.72rem', borderRadius: '8px', borderColor: '#fce4e4', color: '#b71c1c', '&:hover': { bgcolor: '#fff5f5', borderColor: '#b71c1c' }, whiteSpace: 'nowrap' }}
                            >
                              Đặt làm mặc định
                            </Button>
                          )}
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" variant="contained"
                              onClick={() => handleOpenAddressDialog(addr)}
                              sx={{ bgcolor: '#eeeeee', color: '#333', boxShadow: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: '#e0e0e0', boxShadow: 'none' } }}
                            >
                              Sửa
                            </Button>
                            <Button size="small" variant="outlined"
                              onClick={() => handleDeleteAddress(addr.id)}
                              sx={{ color: '#b71c1c', borderColor: '#fce4e4', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem', '&:hover': { borderColor: '#b71c1c', bgcolor: '#fff5f5' } }}
                            >
                              Xóa
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          )}

          {/* TAB 7 - ORDERS */}
          {tabValue === 7 && (
            <Box>
              {!selectedOrderDetails ? (
                /* ── DANH SÁCH ĐƠN HÀNG ── */
                <Paper sx={{ borderRadius: '24px', overflow: 'hidden' }}>
                  <Box sx={{ p: 3, borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="h6" fontWeight={800}>📦 Đơn hàng của tôi</Typography>
                      <Typography variant="caption" color="text.secondary">Tổng {orders.length} đơn hàng</Typography>
                    </Box>
                  </Box>
                  {loadingOrders ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
                  ) : orders.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography fontSize={48}>📭</Typography>
                      <Typography variant="h6" fontWeight={700} mt={1}>Chưa có đơn hàng nào</Typography>
                      <Typography variant="body2" color="text.secondary">Hãy mua sắm ngay để có đơn hàng đầu tiên của bạn!</Typography>
                    </Box>
                  ) : (
                    <Box>
                      {orders.map((order) => (
                        <Box key={order.id} onClick={() => setSelectedOrderDetails(order)} sx={{ p: 3, borderBottom: '1px solid #f9f9f9', cursor: 'pointer', transition: 'background 0.2s', '&:hover': { bgcolor: '#fff8f8' }, '&:last-child': { borderBottom: 'none' } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>VẬN CHUYỂN ĐƠN HÀNG</Typography>
                              <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2 }}>Đơn #{order.id}</Typography>
                              <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleString('vi-VN')}</Typography>
                            </Box>
                            <Box sx={{ textAlign: 'right' }}>
                              <Chip label={getStatusText(order.status)} size="small" sx={{ bgcolor: getStatusColor(order.status), color: 'white', fontWeight: 700, mb: 0.5 }} />
                              <Typography variant="subtitle1" fontWeight={800} color="#c62828" display="block">{formatPrice(order.totalAmount)}</Typography>
                              <Typography variant="caption" color="text.secondary">{order.OrderItems?.length || 1} sản phẩm</Typography>
                            </Box>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                            <Button size="small" variant="contained" sx={{ bgcolor: '#c62828', textTransform: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: '#b71c1c' } }}>
                              Xem chi tiết
                            </Button>
                            {order.status === 'pending' && (
                              <Button size="small" variant="outlined" color="error" sx={{ textTransform: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.75rem' }} onClick={(e) => { e.stopPropagation(); handleOpenCancelDialog(order); }}>
                                Hủy đơn
                              </Button>
                            )}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>
              ) : (
                /* ── CHI TIẾT ĐƠN HÀNG ── */
                <Box>
                  {/* Header */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <IconButton size="small" onClick={() => setSelectedOrderDetails(null)} sx={{ bgcolor: '#f5f5f5', mr: 1 }}>
                          <Close fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', fontSize: '0.65rem' }}>VẬN CHUYỂN ĐƠN HÀNG</Typography>
                      </Box>
                      <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1 }}>Đơn #{selectedOrderDetails.id}</Typography>
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        Đặt lúc {new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN')}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                      <Button variant="outlined" startIcon={<Print />} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#ddd', color: '#333', '&:hover': { borderColor: '#bbb', bgcolor: '#f9f9f9' } }}>
                        In hóa đơn
                      </Button>
                      {selectedOrderDetails.status === 'pending' && (
                        <Button variant="contained" startIcon={<Edit />} sx={{ bgcolor: '#c62828', borderRadius: '10px', textTransform: 'none', fontWeight: 700, '&:hover': { bgcolor: '#b71c1c' } }} onClick={() => handleOpenCancelDialog(selectedOrderDetails)}>
                          Hủy đơn
                        </Button>
                      )}
                    </Box>
                  </Box>

                  <Grid container spacing={3}>
                    {/* LEFT COLUMN */}
                    <Grid item xs={12} md={4}>
                      {/* Timeline */}
                      <Paper sx={{ p: 3, borderRadius: '20px', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <Typography variant="subtitle1" fontWeight={800} mb={2}>Tiến trình giao hàng</Typography>
                        {[
                          { label: 'Đặt hàng',   sub: new Date(selectedOrderDetails.createdAt).toLocaleString('vi-VN'), done: true },
                          { label: 'Xác nhận',   sub: 'Đơn hàng đã được xác nhận',   done: ['processing','shipped','out_for_delivery','delivery_confirmed','delivered'].includes(selectedOrderDetails.status) },
                          { label: 'Chờ shipper',sub: 'Sẵn sàng để giao',             done: ['shipped','out_for_delivery','delivery_confirmed','delivered'].includes(selectedOrderDetails.status) },
                          { label: 'Đang giao',  sub: 'Shipper đang trên đường giao', done: ['out_for_delivery','delivery_confirmed','delivered'].includes(selectedOrderDetails.status), active: ['out_for_delivery','delivery_confirmed'].includes(selectedOrderDetails.status) },
                          { label: 'Đã giao',    sub: 'Giao hàng thành công',         done: selectedOrderDetails.status === 'delivered', active: selectedOrderDetails.status === 'delivered' },
                        ].map((step, i) => {
                          const isCancelled = selectedOrderDetails.status === 'cancelled';
                          const isDone = !isCancelled && step.done;
                          const isActive = !isCancelled && step.active;
                          return (
                            <Box key={i} sx={{ display: 'flex', gap: 2, position: 'relative' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: isDone ? '#c62828' : isActive ? '#fff' : '#f0f0f0', border: isActive ? '2px solid #c62828' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                                  {isDone ? <CheckCircle sx={{ color: 'white', fontSize: 20 }} /> : <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: isActive ? '#c62828' : '#ccc' }} />}
                                </Box>
                                {i < 4 && <Box sx={{ width: 2, height: 36, bgcolor: isDone ? '#c62828' : '#eee', my: 0.5 }} />}
                              </Box>
                              <Box sx={{ pb: i < 3 ? 1 : 0, pt: 0.5 }}>
                                <Typography variant="body2" fontWeight={isDone || isActive ? 700 : 400} color={isDone ? '#333' : isActive ? '#c62828' : '#aaa'}>
                                  {step.label}
                                </Typography>
                                <Typography variant="caption" color={isDone ? 'text.secondary' : '#ccc'}>{step.sub}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                        {selectedOrderDetails.status === 'cancelled' && (
                          <Box sx={{ mt: 1, p: 1.5, bgcolor: '#fff5f5', borderRadius: '10px', border: '1px solid #ffcdd2' }}>
                            <Typography variant="caption" color="#c62828" fontWeight={700}>⚠️ Đơn hàng đã bị hủy</Typography>
                          </Box>
                        )}
                      </Paper>

                      {/* Shipping Details */}
                      <Paper sx={{ p: 3, borderRadius: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <LocalShipping sx={{ color: '#c62828' }} />
                          <Typography variant="subtitle1" fontWeight={800} color="#c62828">Thông tin giao hàng</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#999', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.6rem' }}>Khách hàng</Typography>
                          <Typography variant="body2" fontWeight={700}>{selectedOrderDetails.User?.name || 'Khách hàng'}</Typography>
                          <Typography variant="body2" color="text.secondary">{selectedOrderDetails.phone || selectedOrderDetails.User?.phone || ''}</Typography>
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#999', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.6rem' }}>Địa chỉ nhận hàng</Typography>
                          <Typography variant="body2" color="text.secondary" lineHeight={1.6}>
                            {typeof selectedOrderDetails.shippingAddress === 'string'
                              ? selectedOrderDetails.shippingAddress
                              : selectedOrderDetails.shippingAddress
                                ? [selectedOrderDetails.shippingAddress.address, selectedOrderDetails.shippingAddress.ward, selectedOrderDetails.shippingAddress.district, selectedOrderDetails.shippingAddress.city].filter(Boolean).join(', ')
                              : 'Không có thông tin'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#999', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.6rem' }}>Phương thức thanh toán</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <CreditCard sx={{ fontSize: 16, color: '#555' }} />
                            <Typography variant="body2" color="text.secondary">{selectedOrderDetails.paymentMethod || 'Thanh toán khi nhận hàng'}</Typography>
                          </Box>
                        </Box>
                      </Paper>
                    </Grid>

                    {/* RIGHT COLUMN */}
                    <Grid item xs={12} md={8}>
                      {/* Ordered Items */}
                      <Paper sx={{ p: 3, borderRadius: '20px', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={800}>Sản phẩm đã đặt</Typography>
                          <Chip label={`${selectedOrderDetails.OrderItems?.length || 0} sản phẩm`} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 700 }} />
                        </Box>
                        {(selectedOrderDetails.OrderItems || []).map((item, idx) => {
                          let imgSrc = item.Product?.images;
                          if (imgSrc) {
                            try {
                              const parsed = JSON.parse(imgSrc);
                              imgSrc = Array.isArray(parsed) ? parsed[0] : imgSrc;
                            } catch (e) {}
                          }
                          return (
                            <Box key={idx} sx={{ display: 'flex', gap: 2, p: 2, bgcolor: idx % 2 === 0 ? '#fafafa' : '#fff', borderRadius: '14px', mb: 1.5, alignItems: 'center' }}>
                              {imgSrc ? (
                                <img src={imgSrc} alt="" style={{ width: 72, height: 72, borderRadius: '12px', objectFit: 'cover', flexShrink: 0 }} />
                              ) : (
                                <Box sx={{ width: 72, height: 72, borderRadius: '12px', bgcolor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <ShoppingCart sx={{ color: '#ccc' }} />
                                </Box>
                              )}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="caption" sx={{ color: '#c62828', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.6rem' }}>
                                  {item.Product?.category || 'Sản phẩm'}
                                </Typography>
                                <Typography variant="body1" fontWeight={700} noWrap>{item.Product?.name || 'Sản phẩm'}</Typography>
                                <Typography variant="caption" color="text.secondary">Số lượng: {item.quantity}</Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                <Typography variant="subtitle2" fontWeight={800} color="#c62828">{formatPrice(item.price)}</Typography>
                                <Typography variant="caption" color="text.secondary">SL: {item.quantity}</Typography>
                              </Box>
                            </Box>
                          );
                        })}
                      </Paper>

                      {/* Financial Overview */}
                      <Box sx={{ bgcolor: '#1a1a2e', borderRadius: '20px', p: 3, color: 'white', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
                        <Typography variant="subtitle1" fontWeight={800} color="rgba(255,255,255,0.7)" mb={2} sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: '0.75rem' }}>
                          Tổng quan tài chính
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)">Tạm tính</Typography>
                          <Typography variant="body2" color="white" fontWeight={600}>{formatPrice(selectedOrderDetails.totalAmount)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)">Phí vận chuyển</Typography>
                          <Typography variant="body2" color="#4caf50" fontWeight={600}>Miễn phí</Typography>
                        </Box>
                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" color="rgba(255,255,255,0.6)">Tổng thanh toán</Typography>
                            <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 700 }}>ĐÃ THANH TOÁN</Typography>
                          </Box>
                          <Typography variant="h5" fontWeight={900} color="#ff6b6b">{formatPrice(selectedOrderDetails.totalAmount)}</Typography>
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Box>
          )}


        </Grid>
      </Grid>

      {/* DIALOGS */}
      {/* Address Dialog */}
      <Dialog open={openAddressDialog} onClose={() => setOpenAddressDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField fullWidth size="small" label="Họ tên" value={addressForm.fullName} onChange={e => setAddressForm({...addressForm, fullName: e.target.value})} />
            <TextField fullWidth size="small" label="Số điện thoại" value={addressForm.phone} error={!!addressPhoneError} helperText={addressPhoneError} onChange={e => {
                const val = e.target.value.replace(/\D/g, '');
                setAddressForm({...addressForm, phone: val});
                setAddressPhoneError(validatePhone(val));
            }} />
            <TextField fullWidth size="small" label="Địa chỉ cụ thể" value={addressForm.address} onChange={e => setAddressForm({...addressForm, address: e.target.value})} />
            <Box sx={{ display: 'flex', gap: 2 }}>
               <TextField fullWidth size="small" label="Tỉnh/Thành phố" value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
               <TextField fullWidth size="small" label="Quận/Huyện" value={addressForm.district} onChange={e => setAddressForm({...addressForm, district: e.target.value})} />
            </Box>
            <TextField fullWidth size="small" label="Phường/Xã" value={addressForm.ward} onChange={e => setAddressForm({...addressForm, ward: e.target.value})} />
            <FormControlLabel control={<Checkbox checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} />} label="Đặt làm địa chỉ mặc định" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAddressDialog(false)} sx={{ color: '#555' }}>Hủy</Button>
          <Button onClick={handleSaveAddress} variant="contained" sx={{ bgcolor: '#b71c1c' }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Bank Dialog */}
      <Dialog open={openBankDialog} onClose={() => setOpenBankDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>{editingBank ? 'Sửa ngân hàng' : 'Thêm ngân hàng'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="caption" sx={{ color: '#8c8c8c', fontWeight: 700, letterSpacing: 0.4 }}>
              BƯỚC 1 - THÔNG TIN TÀI KHOẢN
            </Typography>
            <TextField
              fullWidth
              size="small"
              select
              label="Chọn ngân hàng"
              value={bankForm.bankName}
              onChange={e => setBankForm({ ...bankForm, bankName: e.target.value })}
            >
              {BANK_OPTIONS.map((bankName) => (
                <MenuItem key={bankName} value={bankName}>
                  {bankName}
                </MenuItem>
              ))}
            </TextField>
            <TextField fullWidth size="small" label="Số tài khoản" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} />
            <TextField fullWidth size="small" label="Tên chủ tài khoản" value={bankForm.accountName} onChange={e => setBankForm({...bankForm, accountName: e.target.value})} />
            <TextField fullWidth size="small" label="Chi nhánh ngân hàng" value={bankForm.branchName} onChange={e => setBankForm({...bankForm, branchName: e.target.value})} />
            <TextField fullWidth size="small" label="Số điện thoại liên kết ngân hàng" value={bankForm.linkedPhone} onChange={e => setBankForm({...bankForm, linkedPhone: e.target.value.replace(/\D/g, '')})} />
            <TextField fullWidth size="small" label="CCCD/CMND người liên kết" value={bankForm.identityNumber} onChange={e => setBankForm({...bankForm, identityNumber: e.target.value.replace(/\D/g, '')})} />
            
            <FormControlLabel control={<Checkbox checked={bankForm.agreeBankTerms} onChange={e => setBankForm({...bankForm, agreeBankTerms: e.target.checked})} />} label="Tôi xác nhận thông tin trên là đúng và đồng ý liên kết tài khoản ngân hàng." />
            <FormControlLabel control={<Checkbox checked={bankForm.isDefault} onChange={e => setBankForm({...bankForm, isDefault: e.target.checked})} />} label="Đặt làm ngân hàng mặc định" />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenBankDialog(false)} sx={{ color: '#555' }}>Hủy</Button>
          <Button onClick={handleSaveBank} variant="contained" sx={{ bgcolor: '#b71c1c' }}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, color: '#c62828' }}>Lý do hủy đơn hàng</DialogTitle>
        <DialogContent>
          <RadioGroup value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
            {cancelReasons.map((reason, idx) => (
              <FormControlLabel key={idx} value={reason} control={<Radio sx={{color:'#b71c1c','&.Mui-checked':{color:'#b71c1c'}}} />} label={reason} />
            ))}
            <FormControlLabel value="other" control={<Radio sx={{color:'#b71c1c','&.Mui-checked':{color:'#b71c1c'}}} />} label="Lý do khác" />
          </RadioGroup>
          {cancelReason === 'other' && (
            <TextField fullWidth multiline rows={3} placeholder="Nhập lý do hủy đơn (bắt buộc)" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} sx={{ mt: 2 }} />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenCancelDialog(false)} sx={{ color: '#555' }}>Không</Button>
          <Button onClick={handleCancelOrderWithReason} disabled={canceling} variant="contained" sx={{ bgcolor: '#b71c1c', '&:hover': {bgcolor: '#8b0000'} }}>
            {canceling ? 'Đang xử lý...' : 'Đồng ý hủy'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Shipper Registration Dialog */}
      <Dialog open={openShipperDialog} onClose={() => setOpenShipperDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #eee' }}>
          Đăng ký làm Shipper
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Vui lòng điền đầy đủ và chính xác thông tin bên dưới để Admin xem xét duyệt hồ sơ đối tác của bạn.
          </Typography>
          <Box component="form" id="shipperForm" onSubmit={handleRegisterShipper} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <TextField label="Số CMND / CCCD" size="small" fullWidth required value={shipperForm.cccd} onChange={e => setShipperForm({...shipperForm, cccd: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <TextField label="Loại phương tiện (VD: Xe máy Honda Wave)" size="small" fullWidth required value={shipperForm.vehicleType} onChange={e => setShipperForm({...shipperForm, vehicleType: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <TextField label="Biển số xe" size="small" fullWidth required value={shipperForm.licensePlate} onChange={e => setShipperForm({...shipperForm, licensePlate: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
            <TextField label="Khu vực muốn hoạt động (Quận/Huyện, Tỉnh/TP)" size="small" fullWidth required value={shipperForm.area} onChange={e => setShipperForm({...shipperForm, area: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenShipperDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>Hủy</Button>
          <Button type="submit" form="shipperForm" disabled={saving} variant="contained" sx={{ bgcolor: '#b71c1c', '&:hover': { bgcolor: '#8b0000' }, borderRadius: 2 }}>Gửi Yêu Cầu</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default ProfilePage;
