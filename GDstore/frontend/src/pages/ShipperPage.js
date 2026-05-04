import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, Card, CardContent, Chip, Button, Avatar,
  Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, CircularProgress, Alert, Snackbar, Divider, IconButton, Badge,
  Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import {
  LocalShipping, CheckCircle, PhotoCamera, Logout,
  Assignment, HourglassTop, Done, Close, ZoomIn, DirectionsBike, History, Refresh
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const fmt = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price).replace('₫', 'đ');

// ── Component header section ──
function SectionHeader({ icon, color, count, title }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Badge badgeContent={count} color="error">
        {React.cloneElement(icon, { sx: { fontSize: 28, color } })}
      </Badge>
      <Typography variant="h6" fontWeight={800} color={color}>{title}</Typography>
    </Box>
  );
}

// ── Component card đơn hàng ──
function OrderCard({ order, mode, onClaim, onConfirm, onViewProof, currentUser }) {
  const configs = {
    claim:   { label: 'Chờ nhận',      color: '#2563eb', bg: '#eff6ff', icon: '📦' },
    confirm: { label: 'Đang giao',        color: '#a2121e', bg: '#fff0f0', icon: '🚚' },
    pending: { label: 'Chờ admin',       color: '#d97706', bg: '#fffbeb', icon: '⏳' },
  };
  const cfg = configs[mode];

  return (
    <Card sx={{
      borderRadius: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: `1.5px solid ${cfg.bg}`, overflow: 'hidden',
      transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 24px rgba(0,0,0,0.14)' }
    }}>
      <Box sx={{ bgcolor: cfg.bg, px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body1" fontWeight={800} color={cfg.color}>{cfg.icon} Đơn #{order.id}</Typography>
          <Chip label={cfg.label} size="small" sx={{ bgcolor: cfg.color, color: 'white', fontWeight: 700, fontSize: '0.7rem' }} />
        </Box>
        <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Typography>
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        {/* Thông tin shipper phụ trách — hiện cho tất cả */}
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5, mb: 2,
          p: 1.5, borderRadius: 1.5,
          bgcolor: mode === 'claim' ? '#f1f5f9' : mode === 'confirm' ? '#f3f0ff' : '#fffbeb',
          border: `1px dashed ${mode === 'claim' ? '#94a3b8' : mode === 'confirm' ? '#c4b5fd' : '#fcd34d'}`
        }}>
          {mode === 'claim' ? (
            <>
              <Avatar sx={{ width: 28, height: 28, bgcolor: '#94a3b8', fontSize: '0.75rem' }}>?</Avatar>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SHIPPER PHỤ TRÁCH</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>Chưa có shipper nhận</Typography>
              </Box>
            </>
          ) : (
            <>
              <Avatar sx={{ width: 28, height: 28, bgcolor: mode === 'confirm' ? '#a2121e' : '#d97706', fontSize: '0.75rem' }}>
                {order.Shipper?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="caption" fontWeight={700} color={mode === 'confirm' ? '#a2121e' : '#d97706'}>
                  SHIPPER PHỤ TRÁCH
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {order.Shipper?.name}
                  {currentUser && order.Shipper?.id === currentUser.id && (
                    <Chip label="(Bạn)" size="small" sx={{ ml: 0.8, height: 18, fontSize: '0.65rem', bgcolor: mode === 'confirm' ? '#fff0f0' : '#fef3c7', color: mode === 'confirm' ? '#a2121e' : '#d97706', fontWeight: 700 }} />
                  )}
                </Typography>
                {order.Shipper?.phone && (
                  <Typography variant="caption" color="text.secondary">📞 {order.Shipper.phone}</Typography>
                )}
              </Box>
            </>
          )}
        </Box>

        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} sm={8}>
            <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
              <Avatar sx={{ width: 36, height: 36, bgcolor: cfg.color, fontSize: '0.9rem' }}>
                {order.User?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700}>{order.User?.name}</Typography>
                <Typography variant="caption" color="text.secondary">📞 {order.phone}</Typography>
              </Box>
            </Box>

            <Box sx={{ bgcolor: '#f8f8f8', borderRadius: 1.5, p: 1.5, mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>📍 ĐỊA CHỈ GIAO HÀNG</Typography>
              <Typography variant="body2" sx={{ mt: 0.3 }}>{order.shippingAddress}</Typography>
            </Box>

            {order.OrderItems?.slice(0, 2).map((item, i) => (
              <Typography key={i} variant="caption" color="text.secondary" display="block">
                • {item.productName} × {item.quantity}
              </Typography>
            ))}
            {order.OrderItems?.length > 2 && (
              <Typography variant="caption" color="text.secondary">+{order.OrderItems.length - 2} sản phẩm khác</Typography>
            )}

            {mode === 'pending' && order.deliveryNote && (
              <Box sx={{ mt: 1.5, bgcolor: '#fffbeb', borderRadius: 1.5, p: 1.5, borderLeft: '3px solid #d97706' }}>
                <Typography variant="caption" color="#d97706" fontWeight={700}>GHI CHÚ:</Typography>
                <Typography variant="body2" sx={{ mt: 0.3 }}>{order.deliveryNote}</Typography>
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
            <Typography variant="h6" fontWeight={900} color={cfg.color} sx={{ mb: 1 }}>
              {fmt(order.totalAmount)}
            </Typography>

            {mode === 'claim' && (
              <Button variant="contained" fullWidth onClick={onClaim} startIcon={<DirectionsBike />}
                sx={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', borderRadius: 2, fontWeight: 700 }}>
                Nhận đơn này
              </Button>
            )}
            {mode === 'confirm' && (
              currentUser && order.Shipper?.id === currentUser.id ? (
                <Button variant="contained" fullWidth onClick={onConfirm} startIcon={<PhotoCamera />}
                  sx={{ background: 'linear-gradient(135deg, #a2121e, #c62828)', borderRadius: 2, fontWeight: 700 }}>
                  Xác nhận giao
                </Button>
              ) : (
                <Box sx={{ bgcolor: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                  <Typography variant="caption" color="#92400e" fontWeight={700}>🔒 Chỉ shipper phụ trách</Typography>
                  <Typography variant="caption" color="#92400e" display="block">mới được xác nhận giao</Typography>
                </Box>
              )
            )}
            {mode === 'pending' && (
              <Button variant="outlined" fullWidth onClick={onViewProof} startIcon={<ZoomIn />}
                sx={{ borderRadius: 2, borderColor: '#d97706', color: '#d97706', fontWeight: 700 }}>
                Xem ảnh đã gửi
              </Button>
            )}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ── Trang chính ──
export default function ShipperPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [orders, setOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myDeliveriesLoading, setMyDeliveriesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [snack, setSnack] = useState({ open: false, type: 'success', text: '' });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, order: null });
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [imageDialog, setImageDialog] = useState({ open: false, url: '' });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'shipper' && user.role !== 'admin') { navigate('/'); return; }
    fetchOrders();
  }, [user]); // eslint-disable-line

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/orders/shipper');
      setOrders(data || []);
    } catch {
      showSnack('error', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyDeliveries = async () => {
    try {
      setMyDeliveriesLoading(true);
      const { data } = await API.get('/orders/my-deliveries');
      setMyDeliveries(data || []);
    } catch {
      showSnack('error', 'Không thể tải lịch sử đơn');
    } finally {
      setMyDeliveriesLoading(false);
    }
  };

  const showSnack = (type, text) => setSnack({ open: true, type, text });

  const handleClaimOrder = async (orderId) => {
    try {
      await API.post(`/orders/${orderId}/claim`);
      showSnack('success', '✅ Đã nhận đơn! Hãy giao hàng.');
      fetchOrders();
    } catch (err) {
      showSnack('error', err.response?.data?.message || 'Lỗi nhận đơn');
    }
  };

  const handleOpenConfirm = (order) => {
    setConfirmDialog({ open: true, order });
    setProofImage(null); setProofPreview(null); setDeliveryNote('');
  };

  const handleCloseConfirm = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setConfirmDialog({ open: false, order: null });
    setProofImage(null); setProofPreview(null); setDeliveryNote('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showSnack('error', 'Ảnh tối đa 10MB'); return; }
    setProofImage(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmitDelivery = async () => {
    if (!proofImage) { showSnack('error', 'Vui lòng chọn ảnh chứng minh'); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('proofImage', proofImage);
      formData.append('deliveryNote', deliveryNote);
      await API.post(`/orders/${confirmDialog.order.id}/confirm-delivery`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showSnack('success', '✅ Đã gửi xác nhận! Chờ admin duyệt.');
      handleCloseConfirm();
      fetchOrders();
    } catch (err) {
      showSnack('error', err.response?.data?.message || 'Lỗi xác nhận');
    } finally {
      setSubmitting(false);
    }
  };

  const availableOrders = orders.filter(o => o.status === 'shipped');
  const myOrders       = orders.filter(o => o.status === 'out_for_delivery');
  const pendingOrders  = orders.filter(o => o.status === 'delivery_confirmed');

  const statusConfig = {
    pending:            { label: 'Chờ xử lý',        color: '#ff9800', bg: '#fff3e0' },
    processing:         { label: 'Đang xử lý',       color: '#2196f3', bg: '#e3f2fd' },
    shipped:            { label: 'Chờ shipper nhận', color: '#6366f1', bg: '#eef2ff' },
    out_for_delivery:   { label: 'Đang giao',         color: '#7c3aed', bg: '#f3f0ff' },
    delivery_confirmed: { label: 'Chờ admin duyệt', color: '#d97706', bg: '#fffbeb' },
    delivered:          { label: 'Đã giao thành công',  color: '#16a34a', bg: '#f0fdf4' },
    cancelled:          { label: 'Đã hủy',            color: '#ef4444', bg: '#fef2f2' },
  };

  const handleTabChange = (_, val) => {
    setActiveTab(val);
    if (val === 1 && myDeliveries.length === 0) fetchMyDeliveries();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#faf9f9', display: 'flex', flexDirection: 'column' }}>

      {/* Sidebar + Content layout */}
      <Box sx={{ display: 'flex', flex: 1 }}>

        {/* ── Sidebar ── */}
        <Box sx={{
          width: { xs: 0, md: 220 }, flexShrink: 0,
          bgcolor: 'white', borderRight: '1px solid #f0e6e6',
          display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)', pt: 3
        }}>
          <Box sx={{ px: 2.5, mb: 3 }}>
            <Typography variant="overline" sx={{ color: '#a2121e', fontWeight: 800, letterSpacing: 1.5, fontSize: '0.7rem' }}>SHIPPER PANEL</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
              <Avatar src={user?.avatarUrl} sx={{ width: 36, height: 36, bgcolor: '#a2121e' }}>{user?.name?.charAt(0).toUpperCase()}</Avatar>
              <Box>
                <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>{user?.name}</Typography>
                <Chip label={user?.role === 'admin' ? 'ADMIN' : 'SHIPPER'} size="small"
                  sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#fff0f0', color: '#a2121e' }} />
              </Box>
            </Box>
          </Box>
          <Divider sx={{ borderColor: '#f9ecec', mb: 1 }} />
          {[
            { icon: <DirectionsBike sx={{ fontSize: 20 }} />, label: 'Đơn cần xử lý', tab: 0, badge: availableOrders.length + myOrders.length + pendingOrders.length },
            { icon: <History sx={{ fontSize: 20 }} />,       label: 'Đơn của tôi',    tab: 1, badge: myDeliveries.length },
          ].map(item => (
            <Box key={item.tab} onClick={() => handleTabChange(null, item.tab)}
              sx={{
                mx: 1.5, mb: 0.5, px: 2, py: 1.2, borderRadius: 2, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: activeTab === item.tab ? '#fff0f0' : 'transparent',
                color: activeTab === item.tab ? '#a2121e' : '#555',
                fontWeight: activeTab === item.tab ? 800 : 500,
                transition: 'all 0.15s',
                '&:hover': { bgcolor: '#fff5f5', color: '#a2121e' }
              }}>
              {item.icon}
              <Typography variant="body2" fontWeight="inherit" color="inherit">{item.label}</Typography>
              {item.badge > 0 && <Chip label={item.badge} size="small" sx={{ ml: 'auto', height: 18, fontSize: '0.65rem', bgcolor: '#a2121e', color: 'white', fontWeight: 700 }} />}
            </Box>
          ))}
          <Box sx={{ mt: 'auto', px: 2, pb: 3 }}>
            <Divider sx={{ borderColor: '#f9ecec', mb: 2 }} />
            <Box onClick={() => { logout(); navigate('/login'); }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', color: '#888', '&:hover': { color: '#a2121e' }, px: 1 }}>
              <Logout sx={{ fontSize: 18 }} />
              <Typography variant="body2" fontWeight={600}>Đăng xuất</Typography>
            </Box>
          </Box>
        </Box>

        {/* ── Main area ── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Stats row */}
          <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #f0e6e6', px: { xs: 2, md: 4 }, py: 2 }}>
            <Grid container spacing={2}>
              {[
                { label: 'Chờ nhận',  value: availableOrders.length, color: '#2563eb', bg: '#eff6ff' },
                { label: 'Đang giao', value: myOrders.length,        color: '#a2121e', bg: '#fff0f0' },
                { label: 'Chờ duyệt', value: pendingOrders.length,   color: '#d97706', bg: '#fffbeb' },
                { label: 'Tổng đơn',  value: orders.length,          color: '#16a34a', bg: '#f0fdf4' },
              ].map(s => (
                <Grid item xs={3} key={s.label}>
                  <Box sx={{ textAlign: 'center', p: { xs: 1, sm: 1.5 }, borderRadius: 2, bgcolor: s.bg }}>
                    <Typography variant="h5" fontWeight={900} color={s.color}>{s.value}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ fontSize: { xs: '0.6rem', sm: '0.72rem' } }}>{s.label}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Mobile tabs */}
          <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #f0e6e6', display: { xs: 'block', md: 'none' } }}>
            <Tabs value={activeTab} onChange={handleTabChange}
              sx={{ '& .Mui-selected': { color: '#a2121e' }, '& .MuiTabs-indicator': { bgcolor: '#a2121e' } }}>
              <Tab label="Đơn cần xử lý" sx={{ fontWeight: 700, textTransform: 'none' }} />
              <Tab label={`Đơn của tôi${myDeliveries.length > 0 ? ` (${myDeliveries.length})` : ''}`} sx={{ fontWeight: 700, textTransform: 'none' }} />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>

        {/* ─── TAB 0: Đơn cần xử lý ─── */}
        {activeTab === 0 && (
          loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7c3aed' }} /></Box>
        ) : orders.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <LocalShipping sx={{ fontSize: 64, color: '#c4b5fd', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">Chưa có đơn hàng nào</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Khi admin chuyển đơn sang trạng thái "Chờ shipper nhận", bạn sẽ thấy tại đây</Typography>
          </Box>
        ) : (
          <>
            {/* Section 1: Đơn chờ nhận */}
            {availableOrders.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={<Assignment />} color="#3b82f6" count={availableOrders.length} title="Đơn hàng chờ nhận" />
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  Nhấn <strong>"Nhận đơn này"</strong> để xác nhận bạn sẽ giao đơn hàng này.
                </Alert>
                <Grid container spacing={2}>
                  {availableOrders.map(order => (
                    <Grid item xs={12} key={order.id}>
                      <OrderCard order={order} mode="claim" onClaim={() => handleClaimOrder(order.id)} currentUser={user} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Section 2: Đơn đang giao */}
            {myOrders.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <SectionHeader icon={<DirectionsBike />} color="#7c3aed" count={myOrders.length} title="Đơn hàng bạn đang giao" />
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                  Nhấn <strong>"Xác nhận giao"</strong> và <strong>upload ảnh chứng minh</strong> khi giao xong.
                </Alert>
                <Grid container spacing={2}>
                  {myOrders.map(order => (
                    <Grid item xs={12} key={order.id}>
                      <OrderCard order={order} mode="confirm" onConfirm={() => handleOpenConfirm(order)} currentUser={user} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Section 3: Chờ admin duyệt */}
            {pendingOrders.length > 0 && (
              <Box>
                <SectionHeader icon={<HourglassTop />} color="#d97706" count={pendingOrders.length} title="Chờ admin xác nhận" />
                <Grid container spacing={2}>
                  {pendingOrders.map(order => (
                    <Grid item xs={12} key={order.id}>
                      <OrderCard order={order} mode="pending" currentUser={user}
                        onViewProof={() => setImageDialog({ open: true, url: `${BASE_URL}${order.deliveryProofImage}` })} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
                </>
              )
            )}

        {/* ─── TAB 1: Đơn của tôi ─── */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#4c1d95">📋 Lịch sử đơn của tôi</Typography>
                <Typography variant="body2" color="text.secondary">Tất cả đơn hàng bạn đã từng nhận và xử lý</Typography>
              </Box>
              <Button size="small" variant="outlined" startIcon={<Refresh />}
                onClick={fetchMyDeliveries} disabled={myDeliveriesLoading}
                sx={{ borderRadius: 2, borderColor: '#7c3aed', color: '#7c3aed', fontWeight: 700 }}>
                Làm mới
              </Button>
            </Box>

            {myDeliveriesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress sx={{ color: '#7c3aed' }} /></Box>
            ) : myDeliveries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <History sx={{ fontSize: 64, color: '#c4b5fd', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">Chưa có đơn nào</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Hãy nhận đơn đầu tiên!</Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2.5, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f3f0ff' }}>
                      {['Mã đơn', 'Khách hàng', 'Địa chỉ', 'Sản phẩm', 'Tổng tiền', 'Trạng thái', 'Ảnh giao'].map(h => (
                        <TableCell key={h} sx={{ fontWeight: 800, color: '#4c1d95', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myDeliveries.map(order => {
                      const sc = statusConfig[order.status] || { label: order.status, color: '#999', bg: '#f5f5f5' };
                      return (
                        <TableRow key={order.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="#4c1d95">#{order.id}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(order.updatedAt).toLocaleDateString('vi-VN')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#7c3aed', fontSize: '0.75rem' }}>
                                {order.User?.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{order.User?.name}</Typography>
                                <Typography variant="caption" color="text.secondary">📞 {order.phone}</Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 160 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {order.shippingAddress}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 160 }}>
                            {order.OrderItems?.slice(0, 2).map((item, i) => (
                              <Typography key={i} variant="caption" color="text.secondary" display="block">
                                • {item.productName} ×{item.quantity}
                              </Typography>
                            ))}
                            {order.OrderItems?.length > 2 && (
                              <Typography variant="caption" color="#a2121e">+{order.OrderItems.length - 2} sản phẩm</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={800} color="#a2121e" sx={{ whiteSpace: 'nowrap' }}>
                              {fmt(order.totalAmount)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={sc.label}
                              size="small"
                              sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.72rem', border: `1px solid ${sc.color}22` }}
                            />
                          </TableCell>
                          <TableCell>
                            {order.deliveryProofImage ? (
                              <Button size="small" variant="outlined" startIcon={<ZoomIn sx={{ fontSize: 14 }} />}
                                onClick={() => setImageDialog({ open: true, url: `${BASE_URL}${order.deliveryProofImage}` })}
                                sx={{ borderRadius: 1.5, borderColor: '#a2121e', color: '#a2121e', fontWeight: 700, fontSize: '0.72rem', px: 1, py: 0.3 }}>
                                Xem
                              </Button>
                            ) : (
                              <Typography variant="caption" color="text.disabled">—</Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}
        </Box>
        </Box>
      </Box>

      {/* Dialog xác nhận giao hàng */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirm} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 800, color: '#4c1d95' }}>
          📦 Xác nhận đã giao hàng
          <IconButton onClick={handleCloseConfirm} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {confirmDialog.order && (
            <Box>
              <Box sx={{ bgcolor: '#f3f0ff', borderRadius: 2, p: 2, mb: 2.5 }}>
                <Typography variant="body2" fontWeight={700} color="#4c1d95">Đơn #{confirmDialog.order.id}</Typography>
                <Typography variant="body2" color="text.secondary">👤 {confirmDialog.order.User?.name} — 📞 {confirmDialog.order.phone}</Typography>
                <Typography variant="body2" color="text.secondary">📍 {confirmDialog.order.shippingAddress}</Typography>
                <Typography variant="body2" fontWeight={700} color="#7c3aed">💰 {fmt(confirmDialog.order.totalAmount)}</Typography>
              </Box>

              <Typography variant="body2" fontWeight={700} sx={{ mb: 1 }}>
                📷 Ảnh chứng minh giao hàng <span style={{ color: '#ef4444' }}>*</span>
              </Typography>
              <Box onClick={() => fileInputRef.current?.click()} sx={{
                border: '2px dashed', borderColor: proofPreview ? '#7c3aed' : '#c4b5fd',
                borderRadius: 2, p: 2, textAlign: 'center', cursor: 'pointer', mb: 2,
                bgcolor: proofPreview ? '#f3f0ff' : 'transparent',
                '&:hover': { borderColor: '#7c3aed', bgcolor: '#f3f0ff' }
              }}>
                {proofPreview ? (
                  <Box>
                    <img src={proofPreview} alt="preview" style={{ maxHeight: 200, maxWidth: '100%', borderRadius: 8 }} />
                    <Typography variant="caption" display="block" color="#7c3aed" sx={{ mt: 1 }}>Nhấn để đổi ảnh</Typography>
                  </Box>
                ) : (
                  <Box>
                    <PhotoCamera sx={{ fontSize: 40, color: '#c4b5fd', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nhấn để chọn ảnh</Typography>
                    <Typography variant="caption" color="text.secondary">(tối đa 10MB)</Typography>
                  </Box>
                )}
              </Box>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />

              <TextField
                label="Ghi chú (tuỳ chọn)" multiline rows={2} fullWidth variant="outlined"
                value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="VD: Đã giao cho người thân, để tại cổng..."
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={handleCloseConfirm} variant="outlined" disabled={submitting}
            sx={{ borderRadius: 2, borderColor: '#c4b5fd', color: '#7c3aed' }}>Hủy</Button>
          <Button onClick={handleSubmitDelivery} variant="contained" disabled={submitting || !proofImage}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
            sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea, #764ba2)', fontWeight: 700 }}>
            {submitting ? 'Đang gửi...' : 'Xác nhận đã giao'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog xem ảnh */}
      <Dialog open={imageDialog.open} onClose={() => setImageDialog({ open: false, url: '' })} maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: '#1a1a2e' } }}>
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between' }}>
          🖼️ Ảnh chứng minh
          <IconButton onClick={() => setImageDialog({ open: false, url: '' })} sx={{ color: 'white' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, textAlign: 'center' }}>
          <img src={imageDialog.url} alt="proof" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snack.type} onClose={() => setSnack({ ...snack, open: false })} sx={{ borderRadius: 2 }}>{snack.text}</Alert>
      </Snackbar>
    </Box>
  );
}
