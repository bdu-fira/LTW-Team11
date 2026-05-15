import React, { useState, useEffect, useMemo } from 'react';
import {
  Container, Typography, Paper, Tabs, Tab, Box,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, FormControlLabel, Checkbox,
  IconButton, Chip, MenuItem, Alert,
  CircularProgress, Avatar, Card, CardContent, useMediaQuery,
  Divider, Snackbar, TablePagination, InputAdornment, Badge
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  Edit, Delete, Add, CloudUpload,
  Close, ShoppingBag, Notifications, Settings,
  People, Inventory, Search, Visibility, AttachMoney, TrendingUp
} from '@mui/icons-material';
import { Select } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { getFirstImage } from '../utils/imageUtils';
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend
} from 'recharts';

// Hàm parse images an toàn
const parseImages = (images) => {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return images.length > 0 ? [images] : [];
    }
  }
  return [];
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const AdminPage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();
  const ADMIN_TAB_STORAGE_KEY = 'adminActiveTab';
  const [tabValue, setTabValue] = useState(() => {
    const navEntry = window.performance?.getEntriesByType?.('navigation')?.[0];
    const isReload = navEntry?.type === 'reload'
      || window.performance?.navigation?.type === 1;

    if (isReload) {
      const savedTab = Number(window.sessionStorage.getItem(ADMIN_TAB_STORAGE_KEY));
      return Number.isInteger(savedTab) && savedTab >= 0 && savedTab <= 4 ? savedTab : 0;
    }

    window.sessionStorage.removeItem(ADMIN_TAB_STORAGE_KEY);
    return 0;
  });

  const [products, setProducts] = useState([]);
  const [productPage, setProductPage] = useState(0);
  const [productRowsPerPage, setProductRowsPerPage] = useState(10);

  const [orders, setOrders] = useState([]);
  const [orderPage, setOrderPage] = useState(0);
  const [orderRowsPerPage, setOrderRowsPerPage] = useState(10);

  const [users, setUsers] = useState([]);
  const [userPage, setUserPage] = useState(0);
  const [userRowsPerPage, setUserRowsPerPage] = useState(10);

  const [productSearch, setProductSearch] = useState('');
  const [productCategory, setProductCategory] = useState('all');
  const [productStockFilter, setProductStockFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');
  const [flashSaleSearch, setFlashSaleSearch] = useState('');

  // Flash Sale management state
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [flashSaleLoading, setFlashSaleLoading] = useState(false);
  const [flashSaleDiscountInput, setFlashSaleDiscountInput] = useState({});
  const [flashSaleConfirmDialog, setFlashSaleConfirmDialog] = useState({ open: false, product: null, discount: 0, enabling: false });
  const [flashSalePage, setFlashSalePage] = useState(0);
  const [flashSaleRowsPerPage, setFlashSaleRowsPerPage] = useState(10);
  const [flashSaleFilter, setFlashSaleFilter] = useState('all'); // 'all' | 'on' | 'off'

  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Dành cho Dialog chi tiết đơn hàng
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [openOrderDetailsDialog, setOpenOrderDetailsDialog] = useState(false);

  // Dành cho Dialog xóa đơn hàng
  const [deleteOrderConfirmDialog, setDeleteOrderConfirmDialog] = useState({ open: false, orderId: null });

  // Dành cho Dialog xác nhận giao hàng (delivery_confirmed)
  const [deliveryConfirmDialog, setDeliveryConfirmDialog] = useState({ open: false, order: null, action: '' });
  const [deliveryImageDialog, setDeliveryImageDialog] = useState({ open: false, url: '' });
  const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  // Dành cho Dialog thống kê người dùng
  const [selectedUserStats, setSelectedUserStats] = useState(null);
  const [openUserStatsDialog, setOpenUserStatsDialog] = useState(false);
  const [userStatsLoading, setUserStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0
  });
  const [dashboardOrders, setDashboardOrders] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [revenueFilterType, setRevenueFilterType] = useState('week');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedWeek, setSelectedWeek] = useState(getWeekNumber(new Date()));
  const revenueFilterLabel = revenueFilterType === 'month'
    ? 'Tháng'
    : revenueFilterType === 'year'
      ? 'Năm'
      : 'Tuần';

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'nha-bep',
    brand: '',
    stock: '', // Thêm isFlashSale và flashSaleDiscount
    images: [],
    isFlashSale: false,
    flashSaleDiscount: 0,
  });

  // Dành cho Shipper Applications
  const [shipperApplications, setShipperApplications] = useState([]);
  const [shipperAppPage, setShipperAppPage] = useState(0);
  const [shipperAppRowsPerPage, setShipperAppRowsPerPage] = useState(10);
  const [openAppDialog, setOpenAppDialog] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    fetchData();
  }, [tabValue]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    window.sessionStorage.setItem(ADMIN_TAB_STORAGE_KEY, String(tabValue));
  }, [tabValue, ADMIN_TAB_STORAGE_KEY]);

  useEffect(() => {
    fetchStats();
    fetchDashboardOrders();
  }, []);

  // Auto-refresh dữ liệu badge (Đơn hàng và Shipper) mỗi 30 giây
  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        const [ordersRes, appsRes] = await Promise.all([
          API.get('/orders/all'),
          API.get('/users/shipper-applications')
        ]);
        setOrders(ordersRes.data || []);
        setShipperApplications(appsRes.data || []);
      } catch (error) {
        console.error('Lỗi tải dữ liệu thông báo:', error);
      }
    };

    fetchBadgeData();
    const interval = setInterval(fetchBadgeData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleChangeProductPage = (event, newPage) => setProductPage(newPage);
  const handleChangeProductRowsPerPage = (event) => {
    setProductRowsPerPage(parseInt(event.target.value, 10));
    setProductPage(0);
  };

  const handleChangeOrderPage = (event, newPage) => setOrderPage(newPage);
  const handleChangeOrderRowsPerPage = (event) => {
    setOrderRowsPerPage(parseInt(event.target.value, 10));
    setOrderPage(0);
  };

  const handleChangeUserPage = (event, newPage) => setUserPage(newPage);
  const handleChangeUserRowsPerPage = (event) => {
    setUserRowsPerPage(parseInt(event.target.value, 10));
    setUserPage(0);
  };

  const handleChangeShipperAppPage = (event, newPage) => setShipperAppPage(newPage);
  const handleChangeShipperAppRowsPerPage = (event) => {
    setShipperAppRowsPerPage(parseInt(event.target.value, 10));
    setShipperAppPage(0);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      if (tabValue === 0) {
        // Dashboard - không cần fetch sản phẩm ở đây
      } else if (tabValue === 1) {
        // Tab Quản lý sản phẩm
        const { data } = await API.get('/products?limit=1000&page=1');
        setProducts(data.products || []);
      } else if (tabValue === 2) {
        // Tab Quản lý đơn hàng
        try {
          const { data } = await API.get('/orders/all');
          setOrders(data || []);
        } catch (error) {
          console.error('Lỗi tải đơn hàng:', error);
          setOrders([]);
        }
      } else if (tabValue === 3) {
        // Tab Quản lý người dùng
        const { data } = await API.get('/users');
        setUsers(data || []);
      } else if (tabValue === 4) {
        // Tab Quản lý Flash Sale
        await fetchFlashSaleProducts();
      } else if (tabValue === 5) {
        // Tab Duyệt Shipper
        const { data } = await API.get('/users/shipper-applications');
        setShipperApplications(data || []);
      }
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      setMessage({ type: 'error', text: 'Không thể tải dữ liệu' });
    } finally {
      setLoading(false);
    }
  };

  const fetchFlashSaleProducts = async () => {
    try {
      setFlashSaleLoading(true);
      const { data } = await API.get('/products?limit=1000&page=1');
      const allProds = data.products || [];
      setFlashSaleProducts(allProds);
      // Khởi tạo discount input cho từng sản phẩm
      const initDiscounts = {};
      allProds.forEach(p => {
        initDiscounts[p.id] = p.flashSaleDiscount || 10;
      });
      setFlashSaleDiscountInput(initDiscounts);
    } catch (err) {
      console.error('Lỗi tải flash sale:', err);
    } finally {
      setFlashSaleLoading(false);
    }
  };

  const handleToggleFlashSale = async (product, discount) => {
    const enabling = !product.isFlashSale;
    setFlashSaleConfirmDialog({ open: true, product, discount: discount || 10, enabling });
  };

  const handleConfirmFlashSale = async () => {
    const { product, discount, enabling } = flashSaleConfirmDialog;
    setFlashSaleConfirmDialog({ open: false, product: null, discount: 0, enabling: false });
    try {
      await API.put(`/products/${product.id}`, {
        ...product,
        images: JSON.stringify(parseImages(product.images)),
        isFlashSale: enabling,
        flashSaleDiscount: enabling ? parseInt(discount) : 0,
      });
      setMessage({
        type: 'success',
        text: enabling
          ? `✅ Đã bật Flash Sale ${discount}% cho "${product.name}"`
          : `⭕ Đã tắt Flash Sale cho "${product.name}"`,
      });
      await fetchFlashSaleProducts();
      fetchStats();
    } catch (err) {
      console.error('Lỗi cập nhật flash sale:', err);
      setMessage({ type: 'error', text: 'Lỗi cập nhật Flash Sale' });
    }
  };

  const handleUpdateDiscount = async (product, newDiscount) => {
    if (!product.isFlashSale) return;
    try {
      await API.put(`/products/${product.id}`, {
        ...product,
        images: JSON.stringify(parseImages(product.images)),
        isFlashSale: true,
        flashSaleDiscount: parseInt(newDiscount),
      });
      setMessage({ type: 'success', text: `✅ Đã cập nhật giảm giá thành ${newDiscount}% cho "${product.name}"` });
      setFlashSaleProducts(prev => prev.map(p =>
        p.id === product.id ? { ...p, flashSaleDiscount: parseInt(newDiscount) } : p
      ));
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi cập nhật % giảm giá' });
    }
  };

  const fetchStats = async () => {
    try {
      // ✅ FIX: Dùng data.total thay vì data.products.length để lấy đúng tổng số
      const productsRes = await API.get('/products?limit=1&page=1');
      const usersRes = await API.get('/users');
      let ordersCount = 0, totalRevenue = 0;
      try {
        const ordersRes = await API.get('/orders/all');
        ordersCount = ordersRes.data?.length || 0;
        totalRevenue = ordersRes.data?.reduce((sum, o) => sum + (o.totalAmount || 0), 0) || 0;
      } catch { }
      setStats({
        totalProducts: productsRes.data.total || 0, // ✅ Dùng total từ backend
        totalOrders: ordersCount,
        totalUsers: usersRes.data?.length || 0,
        totalRevenue: totalRevenue || 0,
      });
    } catch (error) {
      console.error('Lỗi tải thống kê:', error);
    }
  };

  const fetchDashboardOrders = async () => {
    try {
      setDashboardLoading(true);
      const { data } = await API.get('/orders/all');
      setDashboardOrders(data || []);
    } catch (error) {
      console.error('Lỗi tải dữ liệu dashboard doanh thu:', error);
      setDashboardOrders([]);
    } finally {
      setDashboardLoading(false);
    }
  };


  const dashboardData = useMemo(() => {
    const deliveredOrders = (dashboardOrders || []).filter(o => o.status === 'delivered');

    const filteredOrders = deliveredOrders.filter((o) => {
      const d = new Date(o.createdAt);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const w = getWeekNumber(d);
      if (revenueFilterType === 'year') return y === selectedYear;
      if (revenueFilterType === 'month') return y === selectedYear && m === selectedMonth;
      if (revenueFilterType === 'week') return y === selectedYear && w === selectedWeek;
      return true;
    });

    let chart = [];
    if (revenueFilterType === 'year') {
      chart = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const inMonth = filteredOrders.filter(o => new Date(o.createdAt).getMonth() + 1 === month);
        const revenue = inMonth.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        return { label: `T${month}`, revenue, orders: inMonth.length };
      });
    } else if (revenueFilterType === 'month') {
      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      chart = Array.from({ length: daysInMonth }, (_, i) => {
        const day = i + 1;
        const inDay = filteredOrders.filter(o => new Date(o.createdAt).getDate() === day);
        const revenue = inDay.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        return { label: `${day}`, revenue, orders: inDay.length };
      });
    } else {
      const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const jan4 = new Date(selectedYear, 0, 4);
      const jan4Day = jan4.getDay() || 7;
      const w1Start = new Date(selectedYear, 0, 4 - (jan4Day - 1));
      const weekStart = new Date(w1Start.getTime() + (selectedWeek - 1) * 7 * 86400000);

      chart = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart.getTime() + i * 86400000);
        const inDay = filteredOrders.filter(o => {
          const od = new Date(o.createdAt);
          return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
        });
        const revenue = inDay.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
        return {
          label: `${dayNames[d.getDay()]} (${d.getDate()}/${d.getMonth() + 1})`,
          revenue,
          orders: inDay.length
        };
      });
    }

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      chart,
      totalRevenue,
      totalOrders,
      avgOrderValue
    };
  }, [dashboardOrders, revenueFilterType, selectedYear, selectedMonth, selectedWeek]);

  const previousPeriodRevenue = useMemo(() => {
    const deliveredOrders = (dashboardOrders || []).filter(o => o.status === 'delivered');
    let prevOrders = [];

    if (revenueFilterType === 'year') {
      prevOrders = deliveredOrders.filter(o => new Date(o.createdAt).getFullYear() === selectedYear - 1);
    } else if (revenueFilterType === 'month') {
      const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      prevOrders = deliveredOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === prevYear && (d.getMonth() + 1) === prevMonth;
      });
    } else {
      prevOrders = deliveredOrders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getFullYear() === selectedYear && getWeekNumber(d) === selectedWeek - 1;
      });
    }

    return prevOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [dashboardOrders, revenueFilterType, selectedYear, selectedMonth, selectedWeek, dashboardData.chart]);

  const revenueChangePercent = previousPeriodRevenue > 0
    ? ((dashboardData.totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100
    : (dashboardData.totalRevenue > 0 ? 100 : 0);

  const handleOpenUserStats = async (u) => {
    setOpenUserStatsDialog(true);
    setUserStatsLoading(true);
    setSelectedUserStats(null);
    try {
      const { data } = await API.get(`/orders/all`);
      
      // Tính toán thống kê mua hàng (buyer)
      const userOrders = (data || []).filter(o => o.userId === u.id || o.User?.id === u.id);
      const userDeliveredOrders = userOrders.filter(o => o.status === 'delivered' || o.status === 'Đã giao');
      const totalSpent = userDeliveredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const totalItemsBought = userOrders.reduce((sum, o) => {
        const items = o.OrderItems || [];
        return sum + items.reduce((s, item) => s + (item.quantity || 1), 0);
      }, 0);

      // Tính toán thống kê giao hàng (shipper)
      const shipperOrders = (data || []).filter(o => o.shipperId === u.id);
      const shipperDelivered = shipperOrders.filter(o => o.status === 'delivered');
      const shipperDelivering = shipperOrders.filter(o => o.status === 'out_for_delivery' || o.status === 'delivery_confirmed');
      const shipperPending = shipperOrders.filter(o => o.status === 'shipped');

      setSelectedUserStats({
        user: u,
        isShipper: u.role === 'shipper',
        // User stats
        totalOrders: userOrders.length,
        userDeliveredOrders: userDeliveredOrders.length,
        totalItemsBought,
        totalSpent,
        recentUserOrders: userOrders.slice(0, 5),
        // Shipper stats
        totalAssigned: shipperOrders.length,
        shipperDelivered: shipperDelivered.length,
        shipperDelivering: shipperDelivering.length,
        shipperPending: shipperPending.length,
        recentShipperOrders: shipperOrders.slice(0, 5),
      });
    } catch (e) {
      console.error('Lỗi tải thống kê người dùng:', e);
    } finally {
      setUserStatsLoading(false);
    }
  };

  const handleReviewShipperApp = async (id, status) => {
    try {
      setLoading(true);
      await API.put(`/users/shipper-applications/${id}`, { action: status });
      setMessage({ type: 'success', text: `Đã ${status === 'approve' ? 'duyệt' : 'từ chối'} đơn đăng ký` });
      // Reload danh sách
      const { data } = await API.get('/users/shipper-applications');
      setShipperApplications(data || []);
      setOpenAppDialog(false);
    } catch (error) {
      console.error('Lỗi duyệt shipper:', error);
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        category: product.category || 'nha-bep',
        brand: product.brand || '',
        stock: product.stock || '',
        images: parseImages(product.images),
        isFlashSale: product.isFlashSale || false,
        flashSaleDiscount: product.flashSaleDiscount || 0,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: '', description: '', price: '',
        category: 'nha-bep', brand: '', stock: '', images: [],
        isFlashSale: false,
        flashSaleDiscount: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập link ảnh' });
      return;
    }
    const newImages = [...(productForm.images || []), imageUrlInput.trim()];
    setProductForm({ ...productForm, images: newImages });
    setOpenImageDialog(false);
    setImageUrlInput('');
    setMessage({ type: 'success', text: 'Thêm link ảnh thành công' });
  };

  const handleRemoveImage = (index) => {
    const newImages = productForm.images.filter((_, i) => i !== index);
    setProductForm({ ...productForm, images: newImages });
  };

  const handleSaveProduct = async () => {
    if (!productForm.name) {
      setMessage({ type: 'error', text: 'Vui lòng nhập tên sản phẩm' });
      return;
    }
    if (!productForm.price) {
      setMessage({ type: 'error', text: 'Vui lòng nhập giá sản phẩm' });
      return;
    }

    try {
      setLoading(true);
      const productData = {
        ...productForm,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock) || 0,
        images: JSON.stringify(productForm.images),
        isFlashSale: productForm.isFlashSale,
        flashSaleDiscount: productForm.isFlashSale ? parseInt(productForm.flashSaleDiscount) || 0 : 0,
      };

      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}`, productData);
        setMessage({ type: 'success', text: 'Cập nhật sản phẩm thành công' });
      } else {
        await API.post('/products', productData);
        setMessage({ type: 'success', text: 'Thêm sản phẩm thành công' });
      }
      setOpenDialog(false);
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Save error:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi lưu sản phẩm' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Bạn có chắc muốn xóa sản phẩm này?')) {
      try {
        await API.delete(`/products/${productId}`);
        setMessage({ type: 'success', text: 'Xóa sản phẩm thành công' });
        fetchData();
        fetchStats();
      } catch {
        setMessage({ type: 'error', text: 'Lỗi xóa sản phẩm' });
      }
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await API.put(`/orders/${orderId}`, { status: newStatus });
      setMessage({ type: 'success', text: 'Cập nhật đơn hàng thành công' });
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Lỗi cập nhật đơn hàng:', error);
      setMessage({ type: 'error', text: 'Lỗi cập nhật đơn hàng' });
    }
  };

  const handleDeleteOrder = (orderId) => {
    setDeleteOrderConfirmDialog({ open: true, orderId });
  };

  const handleDeleteOrderConfirm = async () => {
    const orderId = deleteOrderConfirmDialog.orderId;
    setDeleteOrderConfirmDialog({ open: false, orderId: null });
    if (!orderId) return;

    try {
      await API.delete(`/orders/${orderId}`);
      setMessage({ type: 'success', text: 'Xóa đơn hàng thành công' });
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Lỗi xóa đơn hàng:', error);
      setMessage({ type: 'error', text: 'Lỗi xóa đơn hàng' });
    }
  };

  const handleOpenOrderDetails = (order) => {
    setSelectedOrderDetails(order);
    setOpenOrderDetailsDialog(true);
  };

  // Admin xác nhận hoặc từ chối delivery_confirmed
  const handleAdminDeliveryAction = async (orderId, action) => {
    try {
      const endpoint = action === 'confirm'
        ? `/orders/${orderId}/admin-confirm-delivered`
        : `/orders/${orderId}/admin-reject-delivery`;
      await API.put(endpoint);
      setMessage({
        type: 'success',
        text: action === 'confirm'
          ? '✅ Đã xác nhận giao hàng thành công!'
          : '❌ Đã từ chối, đơn hàng đã bị hủy'
      });
      setDeliveryConfirmDialog({ open: false, order: null, action: '' });
      fetchData();
      fetchStats();
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi xử lý' });
    }
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      const { data } = await API.put(`/users/${userId}/status`);
      setMessage({ type: 'success', text: data.message });
      fetchData(); // reload danh sách users
    } catch (error) {
      console.error('Lỗi vô hiệu hóa tài khoản:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Lỗi vô hiệu hóa tài khoản' });
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '0đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
      .format(price).replace('₫', 'đ');
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending:            '⏳ Chờ xử lý',
      processing:         '🔄 Đang xử lý',
      shipped:            '📦 Chờ shipper nhận',
      out_for_delivery:   '🚚 Đang giao',
      delivery_confirmed: '📸 Chờ duyệt',
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
      case 'out_for_delivery':   return '#9c27b0';
      case 'delivery_confirmed': return '#f59e0b';
      case 'delivered':          return '#4caf50';
      case 'cancelled':          return '#f44336';
      default:                   return '#999';
    }
  };

  const isStatusDisabled = (currentStatus, optionValue) => {
    if (currentStatus === optionValue) return false;
    if (['cancelled', 'delivered', 'out_for_delivery', 'delivery_confirmed', 'shipped'].includes(currentStatus)) return true;
    if (currentStatus === 'pending')    return !['processing', 'cancelled'].includes(optionValue);
    if (currentStatus === 'processing') return !['shipped', 'cancelled'].includes(optionValue);
    return true;
  };

  const filteredProducts = products.filter(p => {
    const matchText =
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.id?.toString().includes(productSearch) ||
      p.category?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase());
    const matchCategory = productCategory === 'all' || p.category === productCategory;
    const matchStock =
      productStockFilter === 'all' ? true :
        productStockFilter === 'instock' ? (p.stock > 10) :
          productStockFilter === 'low' ? (p.stock > 0 && p.stock <= 10) :
            (p.stock === 0);
    return matchText && matchCategory && matchStock;
  });

  const filteredOrders = orders.filter(o => {
    const matchSearch =
      o.id?.toString().includes(orderSearch) ||
      o.User?.name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.User?.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.phone?.includes(orderSearch) ||
      o.User?.phone?.includes(orderSearch);
    const matchStatus = orderStatusFilter === 'all' || o.status === orderStatusFilter;
    return matchSearch && matchStatus;
  });

  const pendingDeliveryCount = orders.filter(o => o.status === 'delivery_confirmed').length;

  const filteredUsers = users.filter(u =>
    u.id?.toString().includes(userSearch) ||
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.phone?.includes(userSearch)
  );

  const adminNavItems = [
    { label: 'Bảng điều khiển', shortLabel: 'Dashboard', icon: <TrendingUp />, value: 0 },
    { label: 'Sản phẩm', shortLabel: 'Sản phẩm', icon: <Inventory />, value: 1 },
    {
      label: 'Đơn hàng', shortLabel: 'Đơn hàng',
      icon: <Badge badgeContent={pendingDeliveryCount || 0} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, top: -4, right: -4 } }}><ShoppingBag /></Badge>,
      value: 2
    },
    { label: 'Người dùng', shortLabel: 'Người dùng', icon: <People />, value: 3 },
    { label: 'Flash Sale', shortLabel: 'Flash Sale', icon: <AttachMoney />, value: 4 },
    { 
      label: 'Duyệt Shipper', shortLabel: 'Duyệt Shipper', 
      icon: <Badge badgeContent={shipperApplications.length || 0} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16, top: -4, right: -4 } }}><People /></Badge>, 
      value: 5 
    },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#faf8f7' }}>
      <Snackbar
        open={message.text !== ''}
        autoHideDuration={3000}
        onClose={() => setMessage({ type: '', text: '' })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={message.type || 'info'} onClose={() => setMessage({ type: '', text: '' })}>
          {message.text}
        </Alert>
      </Snackbar>

      {/* Sidebar Navigation */}
      <Box sx={{
        width: 260,
        bgcolor: '#ffffff',
        borderRight: '1px solid #f0e6e6',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto'
      }}>
        {/* Logo Area */}
        <Box sx={{ p: 4, mb: 2 }}>
          <Typography variant="h5" fontWeight="900" sx={{ color: '#1a1a1a', letterSpacing: '-0.5px' }}>
            GD Store
          </Typography>
          <Typography variant="caption" sx={{ color: '#a0a0a0', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Bảng quản trị
          </Typography>
        </Box>

        {/* Navigation */}
        <Box sx={{ flex: 1, px: 2 }}>
          {adminNavItems.map((item) => {
            const active = tabValue === item.value;
            return (
              <Box
                key={item.value}
                onClick={() => setTabValue(item.value)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1.5,
                  cursor: 'pointer',
                  bgcolor: active ? '#faeaea' : 'transparent',
                  color: active ? '#a10a12' : '#888',
                  borderRight: active ? '3px solid #a10a12' : '3px solid transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: active ? '#faeaea' : '#f9f9f9',
                    color: active ? '#a10a12' : '#333'
                  }
                }}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 20 } })}
                <Typography variant="body2" fontWeight={active ? "bold" : "medium"}>
                  {item.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Bottom Sidebar - Create button & Admin profile */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar src={user?.avatar} sx={{ width: 40, height: 40, bgcolor: '#333' }}>
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </Avatar>
            <Box>
              <Typography variant="body2" fontWeight="bold" color="#1a1a1a">
                {user?.name || 'Admin Logo'}
              </Typography>
              <Typography variant="caption" color="#a0a0a0" sx={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 'bold' }}>
                GD STORE ADMIN
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Mobile Header */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            py: 1.5,
            bgcolor: '#fff',
            borderBottom: '1px solid #f0e6e6',
            position: 'sticky',
            top: 0,
            zIndex: 10
          }}
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={900} sx={{ letterSpacing: 0.5, color: '#5a0d12', textTransform: 'uppercase' }}>
              GD Store
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {adminNavItems.find(item => item.value === tabValue)?.label}
            </Typography>
          </Box>
          <Avatar src={user?.avatar} sx={{ width: 34, height: 34, bgcolor: '#333' }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </Avatar>
        </Box>

        {/* Dynamic Content Wrapper */}
        <Box sx={{ p: { xs: 2, md: 4 }, pt: { xs: 2, md: 4 }, pb: { xs: 11, md: 4 }, flex: 1, overflowY: 'auto' }}>

          {/* Vùng Dashboard Doanh thu (Overview Performance) */}
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1.5, sm: 0 } }}>
                <Box>
                  <Typography variant="h4" fontWeight="900" sx={{ mb: 0.5, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.55rem', md: '2.125rem' } }}>Tổng quan hiệu suất</Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.88rem', md: '1rem' } }}>Cập nhật trực tiếp số liệu hoạt động của GD Store.</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, width: { xs: '100%', sm: 'auto' } }}>
                  <Button variant="contained" sx={{ bgcolor: '#faeaea', color: '#111', textTransform: 'none', fontWeight: 'bold', boxShadow: 'none', borderRadius: 2, '&:hover': { bgcolor: '#f0e0e0' } }}>Tải báo cáo</Button>
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                {/* Profile Card Mini */}
                <Grid item xs={12} md={3} sx={{ display: { xs: 'none', md: 'block' } }}>
                  <Card sx={{ py: 1.5, px: 2, borderRadius: 3, boxShadow: 'none', border: '1px solid #eee', height: '100%' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 48, height: 48, bgcolor: '#333' }}>{user?.name?.charAt(0).toUpperCase() || 'A'}</Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>{user?.name || 'Julian Sterling'}</Typography>
                          <Typography variant="caption" color="text.secondary">Quản lý Cửa hàng</Typography>
                        </Box>
                      </Box>
                      <Chip label="ĐANG HOẠT ĐỘNG" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', height: 22, fontSize: '0.65rem' }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px solid #f5f5f5' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>QUYỀN TRUY CẬP</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>Toàn quyền</Typography>
                      </Box>
                      <Box textAlign="right">
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontWeight: 'bold' }}>HOẠT ĐỘNG</Typography>
                        <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.8rem' }}>Online</Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>

                {/* Gross Revenue */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ py: 1.5, px: 2, borderRadius: 3, boxShadow: 'none', bgcolor: '#fae7e6', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.64rem', md: '0.7rem' }, fontWeight: 'bold', letterSpacing: { xs: 0.4, md: 1 } }}>
                      TỔNG DOANH THU
                      <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>
                        ({revenueFilterLabel})
                      </Box>
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#a2121e', mt: 0.5, mb: 0.5, letterSpacing: '-1px' }}>{formatPrice(dashboardData.totalRevenue)}</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#059669' }}>📈 +12.4%</Typography>
                    <AttachMoney sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 90, color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
                  </Card>
                </Grid>

                {/* Delivered Orders */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ py: 1.5, px: 2, borderRadius: 3, boxShadow: 'none', bgcolor: '#ffffff', border: '1px solid #eee', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.64rem', md: '0.7rem' }, fontWeight: 'bold', letterSpacing: { xs: 0.4, md: 1 } }}>
                      ĐƠN ĐÃ GIAO
                      <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>
                        ({revenueFilterLabel})
                      </Box>
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a1a1a', mt: 0.5, mb: 0.5, letterSpacing: '-1px' }}>{new Intl.NumberFormat('en-US').format(dashboardData.totalOrders)}</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#059669' }}>📈 +8.1%</Typography>
                    <ShoppingBag sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, color: '#faf6f5', pointerEvents: 'none' }} />
                  </Card>
                </Grid>

                {/* Avg Order Value */}
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ py: 1.5, px: 2, borderRadius: 3, boxShadow: 'none', bgcolor: '#fcf8f2', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.64rem', md: '0.7rem' }, fontWeight: 'bold', letterSpacing: { xs: 0.4, md: 1 } }}>
                      GIÁ TRỊ ĐƠN T.BÌNH
                      <Box component="span" sx={{ opacity: 0.6, ml: 0.5 }}>
                        ({revenueFilterLabel})
                      </Box>
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#1a1a1a', mt: 0.5, mb: 0.5, letterSpacing: '-1px' }}>{formatPrice(dashboardData.avgOrderValue)}</Typography>
                    <Typography variant="caption" fontWeight="bold" sx={{ color: '#e11d48' }}>📉 -2.3%</Typography>
                    <TrendingUp sx={{ position: 'absolute', right: -10, bottom: -10, fontSize: 80, color: '#fdeee5', pointerEvents: 'none' }} />
                  </Card>
                </Grid>
              </Grid>

              {/* Chart Section */}
              <Card sx={{ p: { xs: 2, md: 3 }, borderRadius: 4, boxShadow: 'none', border: '1px solid #eee' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 }, alignItems: { xs: 'flex-start', md: 'center' } }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>Dự phóng doanh thu</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.84rem', md: '0.875rem' } }}>So sánh giữa doanh thu mục tiêu và thực tế.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: { xs: 1, md: 3 }, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#a2121e', borderRadius: '50%' }} />
                      <Typography variant="caption" fontWeight="bold" color="#555" sx={{ textTransform: 'uppercase', fontSize: { xs: '0.62rem', md: '0.75rem' } }}>Doanh thu</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: { xs: 0, md: 2 } }}>
                      <Box sx={{ width: 12, height: 12, bgcolor: '#faeaea', borderRadius: '50%', border: '2px solid #059669' }} />
                      <Typography variant="caption" fontWeight="bold" color="#555" sx={{ textTransform: 'uppercase', fontSize: { xs: '0.62rem', md: '0.75rem' } }}>Số đơn hàng</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                      <Select
                        size="small"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        sx={{
                          bgcolor: '#fafafa', borderRadius: 2, fontWeight: 'bold', fontSize: '0.85rem',
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          minWidth: { xs: 96, md: 100 },
                          flex: { xs: 1, md: 'unset' }
                        }}
                      >
                        {[2024, 2025, 2026, 2027].map(y => <MenuItem key={y} value={y}>Năm {y}</MenuItem>)}
                      </Select>

                      {revenueFilterType === 'week' && (
                        <Select
                          size="small"
                          value={selectedWeek}
                          onChange={(e) => setSelectedWeek(e.target.value)}
                          sx={{
                            bgcolor: '#fafafa', borderRadius: 2, fontWeight: 'bold', fontSize: '0.85rem',
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            minWidth: { xs: 96, md: 100 },
                            flex: { xs: 1, md: 'unset' }
                          }}
                        >
                          {Array.from({ length: 52 }, (_, i) => i + 1)
                            .filter(w => {
                              const currentYear = new Date().getFullYear();
                              const yearValue = parseInt(selectedYear);
                              if (yearValue < currentYear) return true;
                              if (yearValue > currentYear) return false;
                              return w <= getWeekNumber(new Date());
                            })
                            .map(w => <MenuItem key={w} value={w}>Tuần {w}</MenuItem>)}
                        </Select>
                      )}

                      {revenueFilterType === 'month' && (
                        <Select
                          size="small"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          sx={{
                            bgcolor: '#fafafa', borderRadius: 2, fontWeight: 'bold', fontSize: '0.85rem',
                            '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            minWidth: { xs: 96, md: 100 },
                            flex: { xs: 1, md: 'unset' }
                          }}
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1)
                            .filter(m => {
                              const currentYear = new Date().getFullYear();
                              const yearValue = parseInt(selectedYear);
                              if (yearValue < currentYear) return true;
                              if (yearValue > currentYear) return false;
                              return m <= (new Date().getMonth() + 1);
                            })
                            .map(m => <MenuItem key={m} value={m}>Tháng {m}</MenuItem>)}
                        </Select>
                      )}

                      <Select
                        size="small"
                        value={revenueFilterType}
                        onChange={(e) => setRevenueFilterType(e.target.value)}
                        sx={{
                          bgcolor: '#fafafa', borderRadius: 2, fontWeight: 'bold', fontSize: '0.85rem',
                          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                          minWidth: { xs: 120, md: 140 },
                          ml: { xs: 0, md: 1 },
                          flex: { xs: 1, md: 'unset' }
                        }}
                      >
                        <MenuItem value="week"><span style={{ marginRight: '8px' }}>📅</span> Theo tuần</MenuItem>
                        <MenuItem value="month"><span style={{ marginRight: '8px' }}>📅</span> Theo tháng</MenuItem>
                        <MenuItem value="year"><span style={{ marginRight: '8px' }}>📅</span> Theo năm</MenuItem>
                      </Select>
                    </Box>
                  </Box>
                </Box>

                {dashboardLoading ? (
                  <Box sx={{ py: 5, textAlign: 'center' }}><CircularProgress sx={{ color: '#a2121e' }} /></Box>
                ) : dashboardData.chart.length === 0 ? (
                  <Box sx={{ py: 5, textAlign: 'center' }}><Typography color="text.secondary">Không có dữ liệu</Typography></Box>
                ) : (
                  <Box sx={{ width: '100%', height: { xs: 310, md: 320 } }}>
                    <ResponsiveContainer>
                      <ComposedChart
                        data={dashboardData.chart}
                        margin={isMobile ? { top: 10, right: 6, left: 6, bottom: 0 } : { top: 20, right: 20, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                        <XAxis
                          dataKey="label"
                          axisLine={false}
                          tickLine={false}
                          interval={isMobile ? 'preserveStartEnd' : 0}
                          minTickGap={isMobile ? 28 : 10}
                          tick={{ fontSize: isMobile ? 9 : 11, fill: '#888', fontWeight: 'bold' }}
                          dy={10}
                        />
                        <YAxis
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          width={isMobile ? 44 : 56}
                          tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                          tick={{ fontSize: isMobile ? 9 : 11, fill: '#888', fontWeight: 'bold' }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          axisLine={false}
                          tickLine={false}
                          allowDecimals={false}
                          width={isMobile ? 24 : 32}
                          tickFormatter={(v) => Math.round(v)}
                          tick={{ fontSize: isMobile ? 9 : 11, fill: '#059669', fontWeight: 'bold' }}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          formatter={(value, name) => [name === 'revenue' ? formatPrice(value) : Math.round(value), name === 'revenue' ? 'Doanh thu' : 'Số đơn hàng']}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} display="none" />
                        <Bar yAxisId="left" dataKey="revenue" fill="#a2121e" radius={[4, 4, 0, 0]} barSize={isMobile ? 26 : 40} name="revenue" />
                        <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#059669', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} name="orders" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </Box>
                )}
              </Card>
            </Box>
          )}

          {/* Tab Sản phẩm */}
          {tabValue === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 } }}>
                <Box>
                  <Typography variant="overline" sx={{ color: '#888', fontWeight: 'bold', letterSpacing: { xs: 1, md: 1.5 }, fontSize: { xs: '0.62rem', md: '0.75rem' } }}>DANH MỤC KHÁCH HÀNG</Typography>
                  <Typography variant="h4" fontWeight="900" sx={{ mt: 0.5, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.55rem', md: '2.125rem' }, lineHeight: 1.25 }}>Quản lý sản phẩm</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
                  <TextField
                    size="small"
                    placeholder="Tìm tên sản phẩm, SKU..."
                    value={productSearch}
                    onChange={(e) => { setProductSearch(e.target.value); setProductPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: '#a2121e' }} /></InputAdornment>, disableUnderline: true }}
                    variant="standard"
                    sx={{ width: { xs: '100%', md: 250 }, bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #f0e6e6' }}
                  />
                </Box>
              </Box>

              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} md={3}>
                  <Card sx={{ py: 1, px: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#fae7e6', borderRadius: 2.5, boxShadow: 'none', height: '100%' }}>
                    <Box sx={{ p: 1, bgcolor: '#f4caca', borderRadius: 1.5 }}><Inventory fontSize="small" sx={{ color: '#a2121e' }} /></Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" fontWeight="bold" color="#888" sx={{ fontSize: '0.6rem', letterSpacing: 0.5 }}>DANH MỤC</Typography>
                      <TextField
                        select
                        fullWidth
                        variant="standard"
                        value={productCategory}
                        onChange={(e) => { setProductCategory(e.target.value); setProductPage(0); }}
                        InputProps={{ disableUnderline: true, sx: { fontWeight: 'bold', fontSize: '0.85rem' } }}
                      >
                        <MenuItem value="all">Tất cả danh mục</MenuItem>
                        {[...new Set(products.map(p => p.category).filter(Boolean))].map(cat => (
                          <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ py: 1, px: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: '#faf6f5', borderRadius: 2.5, boxShadow: 'none', height: '100%' }}>
                    <Box sx={{ p: 1, bgcolor: '#f0eaea', borderRadius: 1.5 }}><AttachMoney fontSize="small" sx={{ color: '#a2121e' }} /></Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" fontWeight="bold" color="#888" sx={{ fontSize: '0.6rem', letterSpacing: 0.5 }}>TÌNH TRẠNG KHO</Typography>
                      <TextField
                        select
                        fullWidth
                        variant="standard"
                        value={productStockFilter}
                        onChange={(e) => { setProductStockFilter(e.target.value); setProductPage(0); }}
                        InputProps={{ disableUnderline: true, sx: { fontWeight: 'bold', fontSize: '0.85rem' } }}
                      >
                        <MenuItem value="all">Tất cả trạng thái</MenuItem>
                        <MenuItem value="instock">✅ Còn hàng (nhiều)</MenuItem>
                        <MenuItem value="low">⚠️ Sắp hết hàng</MenuItem>
                        <MenuItem value="out">❌ Hết hàng</MenuItem>
                      </TextField>
                    </Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Card sx={{ py: 1, px: 2, bgcolor: '#a2121e', color: 'white', borderRadius: 2.5, boxShadow: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
                    <Box>
                      <Typography variant="caption" fontWeight="bold" sx={{ color: '#fca5a5', fontSize: '0.6rem', letterSpacing: 0.5, opacity: 0.9 }}>SẢN PHẨM HIỆN CÓ</Typography>
                      <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.2 }}>{new Intl.NumberFormat('en-US').format(filteredProducts.length)}</Typography>
                    </Box>
                    <Box sx={{ p: 0.8, bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 1.5 }}><TrendingUp fontSize="small" /></Box>
                  </Card>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', stock: '', images: [], isFlashSale: false, flashSaleDiscount: 0 }); setOpenDialog(true); }}
                    sx={{
                      height: '100%',
                      bgcolor: '#faf6f5',
                      color: '#a2121e',
                      border: '2px dashed #f0c5c5',
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#fcebe9', borderColor: '#a2121e' }
                    }}
                  >
                    + Thêm sản phẩm mới
                  </Button>
                </Grid>
              </Grid>

              {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#a2121e' }} /></Box> : (
                <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #fae7e6', bgcolor: '#fae7e6' }}>
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: { xs: 860, md: '100%' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>THÔNG TIN SẢN PHẨM</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>DANH MỤC</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>GIÁ BÁN</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>TỒN KHO</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', textAlign: 'right', pr: 4 }}>THAO TÁC</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredProducts
                          .slice(productPage * productRowsPerPage, productPage * productRowsPerPage + productRowsPerPage)
                          .map((product) => (
                            <TableRow key={product.id} sx={{ '&:hover': { bgcolor: '#fff5f5' } }}>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar src={getFirstImage(product.images, '')} variant="rounded" sx={{ width: 48, height: 48, bgcolor: 'white', border: '1px solid #eee' }} />
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold" sx={{ color: '#1a1a1a' }}>{product.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>SKU: GD-W-{(product.id).toString().padStart(4, '0')}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Chip label={product.category} size="small" sx={{ bgcolor: '#f4caca', color: '#1a1a1a', fontWeight: 'bold', fontSize: '0.7rem', borderRadius: 1 }} />
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Box>
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: '#1a1a1a' }}>
                                    {product.isFlashSale ? formatPrice(product.price * (1 - (product.flashSaleDiscount || 0) / 100)) : formatPrice(product.price)}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textDecoration: product.isFlashSale ? 'line-through' : 'none' }}>
                                    MSRP: {formatPrice(Math.round(product.price * 1.25))}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: product.stock > 10 ? '#059669' : product.stock > 0 ? '#eab308' : '#e11d48' }} />
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: product.stock > 10 ? '#1a1a1a' : product.stock > 0 ? '#1a1a1a' : '#e11d48' }}>
                                    {product.stock > 10 ? `Còn ${product.stock} sản phẩm` : product.stock > 0 ? `Còn ${product.stock} cái (Sắp hết)` : 'Hết hàng'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec', textAlign: 'right', pr: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5 }}>
                                  <IconButton size="small" onClick={() => handleOpenDialog(product)} sx={{ color: '#555' }}><Edit fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleDeleteProduct(product.id)} sx={{ color: '#a2121e' }}><Delete fontSize="small" /></IconButton>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f9ecec' }}>
                    <Typography variant="body2" color="text.secondary">
                      Đang hiển thị từ {productPage * productRowsPerPage + 1} đến {Math.min((productPage + 1) * productRowsPerPage, filteredProducts.length)} trong tổng số {filteredProducts.length} sản phẩm
                    </Typography>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredProducts.length}
                      rowsPerPage={productRowsPerPage}
                      page={productPage}
                      onPageChange={handleChangeProductPage}
                      onRowsPerPageChange={handleChangeProductRowsPerPage}
                      labelDisplayedRows={() => ''}
                      labelRowsPerPage=""
                      sx={{ '.MuiTablePagination-selectLabel, .MuiTablePagination-select': { display: 'none' }, '.MuiTablePagination-actions': { color: '#a2121e' } }}
                    />
                  </Box>
                </Card>
              )}
            </Box>
          )}

          {/* Tab Đơn hàng */}
          {tabValue === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 } }}>
                <Box>
                  <Typography variant="overline" sx={{ color: '#888', fontWeight: 'bold', letterSpacing: { xs: 1, md: 1.5 }, fontSize: { xs: '0.62rem', md: '0.75rem' } }}>QUẢN LÝ ĐƠN HÀNG</Typography>
                  <Typography variant="h4" fontWeight="900" sx={{ mt: 0.5, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.55rem', md: '2.125rem' }, lineHeight: 1.25 }}>Đơn hàng</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', width: { xs: '100%', md: 'auto' } }}>
                  <Button
                    size="small" variant="outlined"
                    onClick={() => { setLoading(true); API.get('/orders/all').then(({ data }) => { setOrders(data || []); setLoading(false); }).catch(() => setLoading(false)); }}
                    sx={{ borderRadius: 2, borderColor: '#a2121e', color: '#a2121e', fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                  >
                    🔄 Cập nhật
                  </Button>
                  <TextField
                    size="small"
                    placeholder="Tìm mã đơn, SĐT..."
                    value={orderSearch}
                    onChange={(e) => { setOrderSearch(e.target.value); setOrderPage(0); }}
                    InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: '#a2121e' }} /></InputAdornment>, disableUnderline: true }}
                    variant="standard"
                    sx={{ width: { xs: '100%', md: 250 }, bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #f0e6e6' }}
                  />
                </Box>
              </Box>

              {/* Alert khi có đơn chờ duyệt */}
              {pendingDeliveryCount > 0 && (
                <Alert
                  severity="warning"
                  sx={{ mb: 2, borderRadius: 2, fontWeight: 600 }}
                  action={
                    <Button size="small" color="inherit" fontWeight="bold"
                      onClick={() => { setOrderStatusFilter('delivery_confirmed'); setOrderPage(0); }}>
                      Xem ngay
                    </Button>
                  }
                >
                  📸 Có <strong>{pendingDeliveryCount}</strong> đơn hàng shipper đã xác nhận giao, chờ bạn duyệt!
                </Alert>
              )}

              {/* Filter status buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {[
                  { value: 'all',               label: 'Tất cả',                color: '#555' },
                  { value: 'pending',            label: '⏳ Chờ xử lý',         color: '#ff9800' },
                  { value: 'processing',         label: '🔄 Đang xử lý',        color: '#2196f3' },
                  { value: 'shipped',            label: '📦 Chờ shipper nhận', color: '#6366f1' },
                  { value: 'out_for_delivery',   label: '🚚 Đang giao',          color: '#9c27b0' },
                  { value: 'delivery_confirmed', label: '📸 Chờ duyệt',         color: '#f59e0b', highlight: true },
                  { value: 'delivered',          label: '✅ Đã giao',           color: '#4caf50' },
                  { value: 'cancelled',          label: '❌ Đã hủy',           color: '#f44336' },
                ].map(s => (
                  <Chip
                    key={s.value}
                    label={s.value === 'delivery_confirmed' && pendingDeliveryCount > 0
                      ? `${s.label} (${pendingDeliveryCount})`
                      : s.label}
                    onClick={() => { setOrderStatusFilter(s.value); setOrderPage(0); }}
                    sx={{
                      fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                      bgcolor: orderStatusFilter === s.value ? s.color : 'white',
                      color: orderStatusFilter === s.value ? 'white' : s.color,
                      border: `1.5px solid ${s.color}`,
                      transition: 'all 0.2s',
                      animation: s.value === 'delivery_confirmed' && pendingDeliveryCount > 0 ? 'pulse 1.5s infinite' : 'none',
                      '@keyframes pulse': { '0%,100%': { boxShadow: 'none' }, '50%': { boxShadow: `0 0 8px ${s.color}` } },
                      '&:hover': { bgcolor: s.color, color: 'white' }
                    }}
                  />
                ))}
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress sx={{ color: '#a2121e' }} /></Box>
              ) : orders.length === 0 ? (
                <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3, boxShadow: 'none', border: '1px solid #fae7e6', bgcolor: '#fae7e6' }}>
                  <Typography variant="h6" color="#1a1a1a">📭 Chưa có đơn hàng nào</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Khi có đơn hàng mới, chúng sẽ hiển thị ở đây</Typography>
                </Card>
              ) : (
                <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #fae7e6', bgcolor: '#fae7e6' }}>
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: { xs: 980, md: '100%' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>MÃ ĐƠN</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>KHÁCH HÀNG</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>SĐT</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>TỔNG TIỀN</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>TRẠNG THÁI</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', textAlign: 'right', pr: 4 }}>THAO TÁC</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredOrders
                          .slice(orderPage * orderRowsPerPage, orderPage * orderRowsPerPage + orderRowsPerPage)
                          .map((order) => (
                            <TableRow key={order.id} sx={{ '&:hover': { bgcolor: '#fff5f5' } }}>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Typography variant="body2" fontWeight="bold">#{order.id}</Typography>
                                <Typography variant="caption" color="text.secondary">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</Typography>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#f4caca', color: '#a2121e', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                    {order.User?.name?.charAt(0) || order.User?.email?.charAt(0) || '?'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">{order.User?.name || 'Khách lẻ'}</Typography>
                                    <Typography variant="caption" color="text.secondary">{order.User?.email || ''}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}><Typography variant="body2">{order.phone || order.User?.phone || '...'}</Typography></TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Typography variant="body2" fontWeight="bold" color="#c62828">{formatPrice(order.totalAmount)}</Typography>
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec' }}>
                                <Chip label={getStatusText(order.status)} size="small" sx={{ bgcolor: getStatusColor(order.status), color: 'white', fontWeight: 500, fontSize: '0.7rem' }} />
                              </TableCell>
                              <TableCell sx={{ borderBottom: '1px solid #f9ecec', textAlign: 'right', pr: 3 }}>
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <IconButton size="small" title="Xem chi tiết" onClick={() => handleOpenOrderDetails(order)} sx={{ color: '#555' }}><Visibility fontSize="small" /></IconButton>
                                  <IconButton size="small" title="Xóa đơn hàng" onClick={() => handleDeleteOrder(order.id)} sx={{ color: '#f44336' }}><Delete fontSize="small" /></IconButton>

                                  {/* Nếu đơn delivery_confirmed: hiện nút xem ảnh + xác nhận/từ chối */}
                                  {order.status === 'delivery_confirmed' ? (
                                    <Box sx={{ display: 'flex', gap: 0.5, flexDirection: 'column' }}>
                                      <Button
                                        size="small" variant="outlined"
                                        onClick={() => setDeliveryImageDialog({ open: true, url: `${BASE_URL}${order.deliveryProofImage}` })}
                                        sx={{ fontSize: '0.7rem', py: 0.2, borderColor: '#f59e0b', color: '#d97706', whiteSpace: 'nowrap' }}
                                      >
                                        📷 Xem ảnh
                                      </Button>
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Button size="small" variant="contained"
                                          onClick={() => setDeliveryConfirmDialog({ open: true, order, action: 'confirm' })}
                                          sx={{ fontSize: '0.65rem', py: 0.2, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, flex: 1 }}
                                        >✅ Duyệt</Button>
                                        <Button size="small" variant="contained"
                                          onClick={() => setDeliveryConfirmDialog({ open: true, order, action: 'reject' })}
                                          sx={{ fontSize: '0.65rem', py: 0.2, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, flex: 1 }}
                                        >❌ Từ chối</Button>
                                      </Box>
                                    </Box>
                                  ) : (
                                    <Select
                                      value={order.status}
                                      size="small"
                                      onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                                      sx={{ minWidth: 120, height: 32, fontSize: '0.8rem', bgcolor: 'white' }}
                                    >
                                      <MenuItem value="pending" disabled={isStatusDisabled(order.status, 'pending')} sx={{ fontSize: '0.8rem' }}>⏳ Chờ xử lý</MenuItem>
                                      <MenuItem value="processing" disabled={isStatusDisabled(order.status, 'processing')} sx={{ fontSize: '0.8rem' }}>🔄 Đang xử lý</MenuItem>
                                      <MenuItem value="shipped" disabled={isStatusDisabled(order.status, 'shipped')} sx={{ fontSize: '0.8rem' }}>📦 Chờ shipper nhận</MenuItem>
                                      <MenuItem value="out_for_delivery" disabled={isStatusDisabled(order.status, 'out_for_delivery')} sx={{ fontSize: '0.8rem' }}>🚚 Đang giao</MenuItem>
                                      <MenuItem value="delivered" disabled={isStatusDisabled(order.status, 'delivered')} sx={{ fontSize: '0.8rem' }}>✅ Đã giao</MenuItem>
                                      <MenuItem value="cancelled" disabled={isStatusDisabled(order.status, 'cancelled')} sx={{ fontSize: '0.8rem' }}>❌ Đã hủy</MenuItem>
                                    </Select>
                                  )}
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f9ecec' }}>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredOrders.length}
                      rowsPerPage={orderRowsPerPage}
                      page={orderPage}
                      onPageChange={handleChangeOrderPage}
                      onRowsPerPageChange={handleChangeOrderRowsPerPage}
                      sx={{ '.MuiTablePagination-actions': { color: '#a2121e' } }}
                    />
                  </Box>
                </Card>
              )}
            </Box>
          )}

          {/* Tab Người dùng */}
          {tabValue === 3 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 } }}>
                <Box>
                  <Typography variant="overline" sx={{ color: '#888', fontWeight: 'bold', letterSpacing: { xs: 1, md: 1.5 }, fontSize: { xs: '0.62rem', md: '0.75rem' } }}>QUẢN LÝ NGƯỜI DÙNG</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" fontWeight="900" sx={{ mt: 0.5, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.55rem', md: '2.125rem' }, lineHeight: 1.25 }}>Người dùng</Typography>
                    <Chip label={`${users.length} tài khoản`} sx={{ mt: 0.5, bgcolor: '#faeaea', color: '#a2121e', fontWeight: 'bold', borderRadius: 2, border: '1px solid #f4caca' }} size="small" />
                  </Box>
                </Box>
                <TextField
                  size="small"
                  placeholder="Tìm ID, tên, email, SĐT..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: '#a2121e' }} /></InputAdornment>, disableUnderline: true }}
                  variant="standard"
                  sx={{ width: { xs: '100%', md: 250 }, bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #f0e6e6' }}
                />
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#a2121e' }} /></Box>
              ) : (
                <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #fae7e6', bgcolor: '#fae7e6' }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>ID</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>AVATAR</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>TÊN</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>EMAIL</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>VAI TRÒ</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>SĐT</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>TRẠNG THÁI</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', textAlign: 'right', pr: 4 }}>HÀNH ĐỘNG</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredUsers
                          .slice(userPage * userRowsPerPage, userPage * userRowsPerPage + userRowsPerPage)
                          .map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>{u.id}</TableCell>
                              <TableCell><Avatar sx={{ width: 40, height: 40 }}>{u.name?.charAt(0).toUpperCase()}</Avatar></TableCell>
                              <TableCell>{u.name}</TableCell>
                              <TableCell>{u.email}</TableCell>
                              <TableCell>
                                <Chip
                                  label={u.role === 'admin' ? '👑 Admin' : u.role === 'shipper' ? '🚚 Shipper' : '👤 User'}
                                  color={u.role === 'admin' ? 'secondary' : u.role === 'shipper' ? 'primary' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>{u.phone || 'Chưa cập nhật'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={u.isActive === false ? 'Vô hiệu hóa' : 'Hoạt động'}
                                  color={u.isActive === false ? 'error' : 'success'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' } }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="info"
                                    startIcon={<Visibility />}
                                    onClick={() => handleOpenUserStats(u)}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    Thống kê
                                  </Button>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color={u.isActive === false ? 'success' : 'error'}
                                    onClick={() => handleToggleUserStatus(u.id)}
                                    disabled={u.id === user?.id || u.role === 'admin'}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    {u.isActive === false ? 'Kích hoạt' : 'Khóa'}
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}

                      </TableBody>
                    </Table>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f9ecec' }}>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={filteredUsers.length}
                        rowsPerPage={userRowsPerPage}
                        page={userPage}
                        onPageChange={handleChangeUserPage}
                        onRowsPerPageChange={handleChangeUserRowsPerPage}
                        sx={{ '.MuiTablePagination-actions': { color: '#a2121e' } }}
                      />
                    </Box>
                  </TableContainer>
                </Card>
              )}
            </Box>
          )}

          {/* Tab Flash Sale */}
          {tabValue === 4 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 } }}>
                <Box>
                  <Typography variant="overline" sx={{ color: '#888', fontWeight: 'bold', letterSpacing: { xs: 1, md: 1.5 }, fontSize: { xs: '0.62rem', md: '0.75rem' } }}>CHƯƠNG TRÌNH KHUYẾN MÃI</Typography>
                  <Typography variant="h4" fontWeight="900" sx={{ mt: 0.5, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.55rem', md: '2.125rem' }, lineHeight: 1.25 }}>Flash Sale</Typography>
                </Box>
                <Chip
                  label={`${flashSaleProducts.filter(p => p.isFlashSale).length} Đang chạy`}
                  sx={{ bgcolor: '#e11d48', color: 'white', fontWeight: 'bold', borderRadius: 2, alignSelf: { xs: 'flex-start', md: 'center' } }}
                />
              </Box>

              {/* Search + Filter + Refresh */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: { xs: 'stretch', md: 'center' }, gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Tìm tên, danh mục, thương hiệu..."
                  value={flashSaleSearch}
                  onChange={(e) => { setFlashSaleSearch(e.target.value); setFlashSalePage(0); }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" sx={{ color: '#a2121e' }} /></InputAdornment>, disableUnderline: true }}
                  variant="standard"
                  sx={{ width: { xs: '100%', md: 280 }, bgcolor: 'white', p: 1, borderRadius: 2, border: '1px solid #f0e6e6' }}
                />
                {/* Filter tabs */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', width: { xs: '100%', md: 'auto' } }}>
                  <Chip
                    label={`Tất cả (${flashSaleProducts.length})`}
                    clickable
                    onClick={() => { setFlashSaleFilter('all'); setFlashSalePage(0); }}
                    sx={{
                      fontWeight: flashSaleFilter === 'all' ? 'bold' : 'normal',
                      bgcolor: flashSaleFilter === 'all' ? '#1a1a1a' : 'white',
                      color: flashSaleFilter === 'all' ? 'white' : '#555',
                      border: '1px solid #eee'
                    }}
                  />
                  <Chip
                    label={`Đang chạy (${flashSaleProducts.filter(p => p.isFlashSale).length})`}
                    clickable
                    onClick={() => { setFlashSaleFilter('on'); setFlashSalePage(0); }}
                    sx={{
                      fontWeight: flashSaleFilter === 'on' ? 'bold' : 'normal',
                      bgcolor: flashSaleFilter === 'on' ? '#a2121e' : 'white',
                      color: flashSaleFilter === 'on' ? 'white' : '#555',
                      border: '1px solid #eee'
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={fetchFlashSaleProducts}
                    sx={{ borderColor: '#e0e0e0', color: '#111', '&:hover': { bgcolor: '#f5f5f5' } }}
                  >
                    🔄
                  </Button>
                </Box>
              </Box>

              {flashSaleLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#a2121e' }} />
                </Box>
              ) : (
                <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #fae7e6', bgcolor: '#fae7e6' }}>
                  <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: { xs: 1050, md: '100%' } }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>ẢNH</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>TÊN SẢN PHẨM</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>DANH MỤC</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>GIÁ GỐC</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>TRẠNG THÁI</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', minWidth: 180, whiteSpace: 'nowrap' }}>% GIẢM GIÁ</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', whiteSpace: 'nowrap' }}>GIÁ SAU GIẢM</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', textAlign: 'center', whiteSpace: 'nowrap' }}>BẬT/TẮT</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {flashSaleProducts
                          .filter(p => {
                            const matchSearch =
                              p.name?.toLowerCase().includes(flashSaleSearch.toLowerCase()) ||
                              p.category?.toLowerCase().includes(flashSaleSearch.toLowerCase()) ||
                              p.brand?.toLowerCase().includes(flashSaleSearch.toLowerCase());
                            const matchStatus =
                              flashSaleFilter === 'all' ? true :
                                flashSaleFilter === 'on' ? p.isFlashSale :
                                  !p.isFlashSale;
                            return matchSearch && matchStatus;
                          })
                          .slice(flashSalePage * flashSaleRowsPerPage, flashSalePage * flashSaleRowsPerPage + flashSaleRowsPerPage)
                          .map((product) => {
                            const currentDiscount = flashSaleDiscountInput[product.id] ?? product.flashSaleDiscount ?? 10;
                            const salePrice = product.price * (1 - currentDiscount / 100);
                            return (
                              <TableRow
                                key={product.id}
                                hover
                                sx={{
                                  bgcolor: product.isFlashSale ? 'rgba(255, 107, 0, 0.04)' : 'inherit',
                                  '&:hover': { bgcolor: product.isFlashSale ? 'rgba(255, 107, 0, 0.08)' : 'rgba(0,0,0,0.04)' },
                                  borderLeft: product.isFlashSale ? '4px solid #ff6b00' : '4px solid transparent',
                                }}
                              >
                                <TableCell>
                                  <Avatar
                                    src={getFirstImage(product.images, '')}
                                    variant="rounded"
                                    sx={{ width: 48, height: 48, border: product.isFlashSale ? '2px solid #ff6b00' : 'none' }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight={product.isFlashSale ? 'bold' : 'normal'}>
                                    {product.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">#{product.id}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip label={product.category} size="small" variant="outlined" />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ color: product.isFlashSale ? 'text.secondary' : 'text.primary', textDecoration: product.isFlashSale ? 'line-through' : 'none' }}>
                                    {formatPrice(product.price)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  {product.isFlashSale ? (
                                    <Chip
                                      label={`⚡ -${product.flashSaleDiscount || 0}%`}
                                      size="small"
                                      sx={{ bgcolor: '#ff6b00', color: 'white', fontWeight: 'bold', fontSize: '0.75rem' }}
                                    />
                                  ) : (
                                    <Chip label="Thường" size="small" variant="outlined" sx={{ color: 'text.secondary' }} />
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={currentDiscount}
                                      onChange={(e) => {
                                        const val = Math.min(99, Math.max(1, parseInt(e.target.value) || 1));
                                        setFlashSaleDiscountInput(prev => ({ ...prev, [product.id]: val }));
                                      }}
                                      inputProps={{ min: 1, max: 99, style: { width: 55, textAlign: 'center', fontWeight: 'bold', color: '#ff6b00' } }}
                                      sx={{
                                        width: 85,
                                        '& .MuiOutlinedInput-root': {
                                          '& fieldset': { borderColor: product.isFlashSale ? '#ff6b00' : '#ddd' },
                                          '&:hover fieldset': { borderColor: '#ff6b00' },
                                        }
                                      }}
                                    />
                                    <Typography variant="body2" color="text.secondary">%</Typography>
                                    {product.isFlashSale && (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleUpdateDiscount(product, currentDiscount)}
                                        sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: '0.7rem', borderColor: '#ff6b00', color: '#ff6b00', '&:hover': { bgcolor: '#fff3e0' } }}
                                      >
                                        Lưu
                                      </Button>
                                    )}
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" fontWeight="bold" sx={{ color: product.isFlashSale ? '#ff6b00' : 'text.secondary' }}>
                                    {product.isFlashSale ? formatPrice(product.price * (1 - (product.flashSaleDiscount || 0) / 100)) : '-'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="center">
                                  <Button
                                    variant={product.isFlashSale ? 'contained' : 'outlined'}
                                    size="small"
                                    onClick={() => handleToggleFlashSale(product, currentDiscount)}
                                    sx={{
                                      bgcolor: product.isFlashSale ? '#ff6b00' : 'transparent',
                                      color: product.isFlashSale ? 'white' : '#ff6b00',
                                      borderColor: '#ff6b00',
                                      fontWeight: 'bold',
                                      minWidth: { xs: 106, md: 90 },
                                      whiteSpace: 'nowrap',
                                      fontSize: { xs: '0.68rem', md: '0.75rem' },
                                      px: { xs: 1, md: 1.5 },
                                      '&:hover': {
                                        bgcolor: product.isFlashSale ? '#e65100' : '#fff3e0',
                                        borderColor: '#e65100',
                                      },
                                    }}
                                  >
                                    {product.isFlashSale ? '⚡ Đang Sale' : '▷ Bật Sale'}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {/* the map function body remains unchanged up to TableBody closing */}
                      </TableBody>
                    </Table>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f9ecec' }}>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={flashSaleProducts.filter(p => {
                          const matchSearch =
                            p.name?.toLowerCase().includes(flashSaleSearch.toLowerCase()) ||
                            p.category?.toLowerCase().includes(flashSaleSearch.toLowerCase()) ||
                            p.brand?.toLowerCase().includes(flashSaleSearch.toLowerCase());
                          const matchStatus =
                            flashSaleFilter === 'all' ? true :
                              flashSaleFilter === 'on' ? p.isFlashSale :
                                !p.isFlashSale;
                          return matchSearch && matchStatus;
                        }).length}
                        rowsPerPage={flashSaleRowsPerPage}
                        page={flashSalePage}
                        onPageChange={(e, newPage) => setFlashSalePage(newPage)}
                        onRowsPerPageChange={(e) => { setFlashSaleRowsPerPage(parseInt(e.target.value, 10)); setFlashSalePage(0); }}
                        sx={{ '.MuiTablePagination-actions': { color: '#a2121e' } }}
                      />
                    </Box>
                  </TableContainer>
                </Card>
              )}

              {/* Confirm Dialog */}
              <Dialog
                open={flashSaleConfirmDialog.open}
                onClose={() => setFlashSaleConfirmDialog({ open: false, product: null, discount: 0, enabling: false })}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle sx={{
                  background: flashSaleConfirmDialog.enabling ? 'linear-gradient(135deg, #ff6b00, #ffa500)' : 'linear-gradient(135deg, #666, #999)',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {flashSaleConfirmDialog.enabling ? '⚡ Bật Flash Sale' : '⭕ Tắt Flash Sale'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                  {flashSaleConfirmDialog.product && (
                    <Box>
                      <Typography variant="body1" sx={{ mb: 2 }}>
                        {flashSaleConfirmDialog.enabling ? (
                          <>Bật Flash Sale <strong>{flashSaleConfirmDialog.discount}%</strong> cho sản phẩm:</>
                        ) : (
                          <>Tắt Flash Sale cho sản phẩm:</>
                        )}
                      </Typography>
                      <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar
                          src={getFirstImage(flashSaleConfirmDialog.product.images, '')}
                          variant="rounded"
                          sx={{ width: 56, height: 56 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight="bold">{flashSaleConfirmDialog.product.name}</Typography>
                          <Typography variant="body2" color="text.secondary">Giá gốc: {formatPrice(flashSaleConfirmDialog.product.price)}</Typography>
                          {flashSaleConfirmDialog.enabling && (
                            <Typography variant="body2" sx={{ color: '#ff6b00', fontWeight: 'bold' }}>
                              Giá sau giảm: {formatPrice(flashSaleConfirmDialog.product.price * (1 - flashSaleConfirmDialog.discount / 100))}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                  <Button
                    onClick={() => setFlashSaleConfirmDialog({ open: false, product: null, discount: 0, enabling: false })}
                    variant="outlined"
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleConfirmFlashSale}
                    variant="contained"
                    sx={{
                      bgcolor: flashSaleConfirmDialog.enabling ? '#ff6b00' : '#666',
                      '&:hover': { bgcolor: flashSaleConfirmDialog.enabling ? '#e65100' : '#444' }
                    }}
                  >
                    {flashSaleConfirmDialog.enabling ? '✅ Xác nhận bật' : '✅ Xác nhận tắt'}
                  </Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* Tab Duyệt Shipper */}
          {tabValue === 5 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 1.5, md: 0 } }}>
                <Box>
                  <Typography variant="overline" sx={{ color: '#888', fontWeight: 'bold', letterSpacing: { xs: 1, md: 1.5 }, fontSize: { xs: '0.62rem', md: '0.75rem' } }}>QUẢN LÝ ĐỐI TÁC</Typography>
                  <Typography variant="h4" fontWeight="900" sx={{ mt: 0.5, color: '#1a1a1a', letterSpacing: '-0.5px', fontSize: { xs: '1.55rem', md: '2.125rem' }, lineHeight: 1.25 }}>Duyệt Shipper</Typography>
                </Box>
              </Box>

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#a2121e' }} /></Box>
              ) : shipperApplications.length === 0 ? (
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Typography color="text.secondary">Hiện không có yêu cầu đăng ký nào cần duyệt.</Typography>
                </Box>
              ) : (
                <Card sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #fae7e6', bgcolor: '#fae7e6' }}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>ID</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>TÊN</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>EMAIL / SĐT</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none' }}>NGÀY ĐĂNG KÝ</TableCell>
                          <TableCell sx={{ color: '#a2121e', fontWeight: 'bold', fontSize: '0.7rem', borderBottom: 'none', textAlign: 'right', pr: 4 }}>HÀNH ĐỘNG</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {shipperApplications
                          .slice(shipperAppPage * shipperAppRowsPerPage, shipperAppPage * shipperAppRowsPerPage + shipperAppRowsPerPage)
                          .map((u) => (
                            <TableRow key={u.id}>
                              <TableCell>{u.id}</TableCell>
                              <TableCell>{u.name}</TableCell>
                              <TableCell>
                                <Typography variant="body2">{u.email}</Typography>
                                <Typography variant="caption" color="text.secondary">{u.phone}</Typography>
                              </TableCell>
                              <TableCell>{new Date(u.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', md: 'row' }, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'flex-end' }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    color="primary"
                                    onClick={() => { setSelectedApp(u); setOpenAppDialog(true); }}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    Xem chi tiết
                                  </Button>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="success"
                                    onClick={() => handleReviewShipperApp(u.id, 'approve')}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    Duyệt
                                  </Button>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="error"
                                    onClick={() => handleReviewShipperApp(u.id, 'reject')}
                                    sx={{ whiteSpace: 'nowrap' }}
                                  >
                                    Từ chối
                                  </Button>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #f9ecec' }}>
                      <TablePagination
                        rowsPerPageOptions={[5, 10, 25, 50]}
                        component="div"
                        count={shipperApplications.length}
                        rowsPerPage={shipperAppRowsPerPage}
                        page={shipperAppPage}
                        onPageChange={handleChangeShipperAppPage}
                        onRowsPerPageChange={handleChangeShipperAppRowsPerPage}
                        sx={{ '.MuiTablePagination-actions': { color: '#a2121e' } }}
                      />
                    </Box>
                  </TableContainer>
                </Card>
              )}
            </Box>
          )}

          {/* Dialog thêm/sửa sản phẩm */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth
            PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
          >
            {/* Header */}
            <Box sx={{ px: 3, pt: 3, pb: 2, borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#1a1a1a">
                  {editingProduct ? '✏️ Sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {editingProduct ? 'Cập nhật thông tin sản phẩm' : 'Điền đầy đủ thông tin để thêm sản phẩm'}
                </Typography>
              </Box>
              <IconButton onClick={() => setOpenDialog(false)} size="small" sx={{ bgcolor: '#f5f5f5', '&:hover': { bgcolor: '#eeeeee' } }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <DialogContent sx={{ px: 3, py: 2.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                {/* Tên sản phẩm */}
                <TextField
                  fullWidth label="Tên sản phẩm *" value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                {/* Mô tả */}
                <TextField
                  fullWidth multiline rows={3} label="Mô tả sản phẩm" value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                {/* Giá & Tồn kho */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth label="Giá (VNĐ) *" type="number" value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <TextField
                    fullWidth label="Tồn kho" type="number" value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>

                {/* Danh mục & Thương hiệu */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    select fullWidth label="Danh mục" value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  >
                    <MenuItem value="nha-bep">🍳 Nhà bếp</MenuItem>
                    <MenuItem value="phong-khach">🛋️ Phòng khách</MenuItem>
                    <MenuItem value="phong-ngu">🛏️ Phòng ngủ</MenuItem>
                    <MenuItem value="dien-tu">📺 Điện tử</MenuItem>
                    <MenuItem value="dung-cu">🔧 Dụng cụ</MenuItem>
                  </TextField>
                  <TextField
                    fullWidth label="Thương hiệu" value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    size="small"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>

                {/* Flash Sale */}
                <Box sx={{ bgcolor: productForm.isFlashSale ? '#fff8e1' : '#fafafa', borderRadius: '10px', p: 1.5, border: `1px solid ${productForm.isFlashSale ? '#ffe082' : '#f0f0f0'}`, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={productForm.isFlashSale}
                        onChange={(e) => setProductForm({ ...productForm, isFlashSale: e.target.checked })}
                        sx={{ color: '#ff6f00', '&.Mui-checked': { color: '#ff6f00' } }}
                        size="small"
                      />
                    }
                    label={<Typography fontWeight={600} fontSize="0.875rem">⚡ Flash Sale</Typography>}
                    sx={{ m: 0 }}
                  />
                  {productForm.isFlashSale && (
                    <TextField
                      label="Giảm giá (%)" type="number" size="small"
                      value={productForm.flashSaleDiscount}
                      onChange={(e) => setProductForm({ ...productForm, flashSaleDiscount: e.target.value })}
                      inputProps={{ min: 1, max: 99 }}
                      sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    />
                  )}
                </Box>

                {/* Hình ảnh */}
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#555" sx={{ mb: 1 }}>Hình ảnh sản phẩm</Typography>
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                    {parseImages(productForm.images).map((img, idx) => (
                      <Box key={idx} sx={{ position: 'relative' }}>
                        <img
                          src={img.startsWith('http') || img.startsWith('data:') ? img : (img.startsWith('/') ? img : `/${img}`)}
                          style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '2px solid #f0f0f0' }}
                          alt={`product-${idx}`}
                        />
                        <IconButton
                          size="small"
                          sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: 20, height: 20 }}
                          onClick={() => handleRemoveImage(idx)}
                        >
                          <Close sx={{ fontSize: 11 }} />
                        </IconButton>
                      </Box>
                    ))}
                    <Button
                      variant="outlined"
                      sx={{ width: 72, height: 72, borderStyle: 'dashed', borderRadius: '8px', borderColor: '#ccc', color: '#999', flexDirection: 'column', gap: 0.3, '&:hover': { borderColor: '#a10a12', color: '#a10a12', bgcolor: '#fff5f5' } }}
                      onClick={() => setOpenImageDialog(true)}
                    >
                      <Add sx={{ fontSize: 18 }} />
                      <Typography sx={{ fontSize: '0.58rem', lineHeight: 1 }}>Thêm ảnh</Typography>
                    </Button>
                  </Box>
                </Box>

              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
              <Button
                onClick={() => setOpenDialog(false)}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, color: '#555', px: 3 }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSaveProduct}
                variant="contained"
                sx={{ bgcolor: '#a10a12', '&:hover': { bgcolor: '#8b0000' }, borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 4 }}
              >
                {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
              </Button>
            </DialogActions>
          </Dialog>
          {/* Dialog thêm link ảnh */}
          <Dialog open={openImageDialog} onClose={() => { setOpenImageDialog(false); setImageUrlInput(''); }} maxWidth="sm" fullWidth>
            <DialogTitle>Thêm link ảnh sản phẩm</DialogTitle>
            <DialogContent>
              <Box sx={{ py: 2 }}>
                <TextField
                  fullWidth
                  label="Link hình ảnh (URL)"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  variant="outlined"
                />
                {imageUrlInput && (
                  <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Xem trước ảnh:</Typography>
                    <img
                      src={imageUrlInput}
                      onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300?text=L%E1%BB%97i+%E1%BA%A3nh'; }}
                      style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, border: '1px solid #ccc', objectFit: 'contain' }}
                      alt="preview"
                    />
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                  Vui lòng dán link ảnh trực tiếp (JPG, PNG, WEBP, v.v...)
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => { setOpenImageDialog(false); setImageUrlInput(''); }}>Hủy</Button>
              <Button
                onClick={handleAddImageUrl}
                disabled={!imageUrlInput.trim()}
                variant="contained"
                sx={{ bgcolor: '#ff6b6b', '&:hover': { bgcolor: '#ff5252' } }}
              >
                Thêm ảnh
              </Button>
            </DialogActions>
          </Dialog>

          {/* Dialog chi tiết đơn hàng */}
          <Dialog open={openOrderDetailsDialog} onClose={() => setOpenOrderDetailsDialog(false)} maxWidth="md" fullWidth>
            {selectedOrderDetails && (
              <>
                <DialogTitle sx={{ borderBottom: '1px solid #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6" fontWeight="bold">Chi tiết đơn hàng #{selectedOrderDetails.id}</Typography>
                  <IconButton onClick={() => setOpenOrderDetailsDialog(false)} size="small" sx={{ bgcolor: '#f5f5f5' }}>
                    <Close fontSize="small" />
                  </IconButton>
                </DialogTitle>
                <DialogContent sx={{ py: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>THÔNG TIN GIAO HÀNG</Typography>
                  <Grid container spacing={1} sx={{ mb: 4 }}>
                    <Grid item xs={3}><Typography variant="body2" color="text.secondary">Khách hàng:</Typography></Grid>
                    <Grid item xs={9}><Typography variant="body2" fontWeight="500">{selectedOrderDetails.User?.name || 'Khách hàng'}</Typography></Grid>
                    <Grid item xs={3}><Typography variant="body2" color="text.secondary">Địa chỉ:</Typography></Grid>
                    <Grid item xs={9}><Typography variant="body2">{selectedOrderDetails.shippingAddress || '-'}</Typography></Grid>
                    <Grid item xs={3}><Typography variant="body2" color="text.secondary">Số điện thoại:</Typography></Grid>
                    <Grid item xs={9}><Typography variant="body2">{selectedOrderDetails.phone || '-'}</Typography></Grid>
                    <Grid item xs={3}><Typography variant="body2" color="text.secondary">Thanh toán:</Typography></Grid>
                    <Grid item xs={9}>
                      <Typography variant="body2" color="primary" fontWeight="500">
                        {selectedOrderDetails.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : selectedOrderDetails.paymentMethod}
                      </Typography>
                    </Grid>
                    <Grid item xs={3}><Typography variant="body2" color="text.secondary">Ghi chú:</Typography></Grid>
                    <Grid item xs={9}><Typography variant="body2">{selectedOrderDetails.note || 'Không có ghi chú'}</Typography></Grid>
                  </Grid>

                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, color: '#333' }}>SẢN PHẨM TRONG ĐƠN HÀNG</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                          <TableCell>Sản phẩm</TableCell>
                          <TableCell align="center">Đơn giá</TableCell>
                          <TableCell align="center">Số lượng</TableCell>
                          <TableCell align="right">Thành tiền</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrderDetails.OrderItems?.length > 0 ? (
                          selectedOrderDetails.OrderItems.map((item, idx) => {
                            let imageUrl = 'https://via.placeholder.com/40';
                            if (item.Product?.images && item.Product.images.length > 0) {
                              imageUrl = getFirstImage(item.Product.images, 'https://via.placeholder.com/40');
                            }
                            return (
                              <TableRow key={idx}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar src={imageUrl} variant="rounded" sx={{ width: 40, height: 40, border: '1px solid #eee' }} />
                                    <Typography variant="body2">{item.productName || item.Product?.name || 'Sản phẩm'}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">{formatPrice(item.price)}</TableCell>
                                <TableCell align="center">x{item.quantity}</TableCell>
                                <TableCell align="right" fontWeight="bold">
                                  {formatPrice(item.price * item.quantity)}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>Không có thông tin sản phẩm</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                    <Box sx={{ width: '320px', p: 2, bgcolor: '#fff5f5', borderRadius: 2, border: '1px dashed #ee4d2d' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Tạm tính:</Typography>
                        <Typography variant="body2">{formatPrice(selectedOrderDetails.totalAmount)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">Phí giao hàng:</Typography>
                        <Typography variant="body2">Miễn phí</Typography>
                      </Box>
                      <Divider sx={{ my: 1.5, borderColor: 'rgba(238, 77, 45, 0.2)' }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle1" fontWeight="bold">Tổng số tiền:</Typography>
                        <Typography variant="h6" color="#c62828" fontWeight="bold">{formatPrice(selectedOrderDetails.totalAmount)}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Thông tin shipper - chỉ hiện khi có shipper xác nhận */}
                  {(selectedOrderDetails.status === 'delivery_confirmed' || selectedOrderDetails.status === 'delivered') &&
                   selectedOrderDetails.deliveryProofImage && (
                    <Box sx={{ mt: 2.5, p: 2, bgcolor: '#fffbeb', borderRadius: 2, border: '1.5px solid #f59e0b' }}>
                      <Typography variant="subtitle2" fontWeight={800} color="#d97706" sx={{ mb: 1.5 }}>
                        🚚 Thông tin xác nhận giao hàng
                      </Typography>
                      {selectedOrderDetails.Shipper && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                          <Avatar sx={{ bgcolor: '#7c3aed', width: 34, height: 34, fontSize: '0.9rem' }}>
                            {selectedOrderDetails.Shipper.name?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{selectedOrderDetails.Shipper.name}</Typography>
                            <Typography variant="caption" color="text.secondary">📞 {selectedOrderDetails.Shipper.phone || selectedOrderDetails.Shipper.email}</Typography>
                          </Box>
                        </Box>
                      )}
                      {selectedOrderDetails.deliveryNote && (
                        <Box sx={{ bgcolor: 'white', borderRadius: 1.5, p: 1.5, mb: 1.5 }}>
                          <Typography variant="caption" fontWeight={700} color="#d97706">GHI CHÚ SHIPPER:</Typography>
                          <Typography variant="body2" sx={{ mt: 0.3 }}>{selectedOrderDetails.deliveryNote}</Typography>
                        </Box>
                      )}
                      <Typography variant="caption" fontWeight={700} color="#d97706" display="block" sx={{ mb: 1 }}>ẢNH CHỨNG MINH:</Typography>
                      <Box
                        onClick={() => setDeliveryImageDialog({ open: true, url: `${BASE_URL}${selectedOrderDetails.deliveryProofImage}` })}
                        sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', maxWidth: 200, '&:hover': { opacity: 0.85 } }}
                      >
                        <img
                          src={`${BASE_URL}${selectedOrderDetails.deliveryProofImage}`}
                          alt="proof"
                          style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid #f59e0b' }}
                        />
                        <Typography variant="caption" color="#d97706" display="block" textAlign="center" sx={{ mt: 0.5 }}>
                          Nhấn để xem ảnh lớn
                        </Typography>
                      </Box>

                      {selectedOrderDetails.status === 'delivery_confirmed' && (
                        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                          <Button variant="contained" size="small"
                            onClick={() => {
                              setOpenOrderDetailsDialog(false);
                              setDeliveryConfirmDialog({ open: true, order: selectedOrderDetails, action: 'confirm' });
                            }}
                            sx={{ flex: 1, bgcolor: '#059669', '&:hover': { bgcolor: '#047857' }, borderRadius: 1.5, fontWeight: 700 }}
                          >✅ Xác nhận đã giao</Button>
                          <Button variant="contained" size="small"
                            onClick={() => {
                              setOpenOrderDetailsDialog(false);
                              setDeliveryConfirmDialog({ open: true, order: selectedOrderDetails, action: 'reject' });
                            }}
                            sx={{ flex: 1, bgcolor: '#dc2626', '&:hover': { bgcolor: '#b91c1c' }, borderRadius: 1.5, fontWeight: 700 }}
                          >❌ Từ chối</Button>
                        </Box>
                      )}
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                  <Button onClick={() => setOpenOrderDetailsDialog(false)} variant="contained" sx={{ bgcolor: '#999', '&:hover': { bgcolor: '#777' } }}>
                    Đóng
                  </Button>
                </DialogActions>
              </>
            )}

          </Dialog>
        </Box> {/* End Dynamic Content Wrapper */}
      </Box> {/* End Main Content Area */}

      {/* ── Dialog Xem ảnh chứng minh giao hàng ── */}
      <Dialog open={deliveryImageDialog.open} onClose={() => setDeliveryImageDialog({ open: false, url: '' })} maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', bgcolor: '#1a1a2e' } }}>
        <DialogTitle sx={{ color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          📷 Ảnh chứng minh giao hàng
          <IconButton onClick={() => setDeliveryImageDialog({ open: false, url: '' })} sx={{ color: 'white' }}><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 1, textAlign: 'center' }}>
          <img src={deliveryImageDialog.url} alt="proof" style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 8 }} />
        </DialogContent>
      </Dialog>

      {/* ── Dialog Xác nhận / Từ chối delivery ── */}
      <Dialog open={deliveryConfirmDialog.open} onClose={() => setDeliveryConfirmDialog({ open: false, order: null, action: '' })} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, pb: 1, color: deliveryConfirmDialog.action === 'confirm' ? '#059669' : '#dc2626' }}>
          {deliveryConfirmDialog.action === 'confirm' ? '✅ Xác nhận đã giao hàng' : '❌ Từ chối xác nhận'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {deliveryConfirmDialog.action === 'confirm'
              ? `Bạn xác nhận đơn hàng #${deliveryConfirmDialog.order?.id} đã được giao thành công?`
              : `Bạn từ chối xác nhận đơn #${deliveryConfirmDialog.order?.id}? Đơn sẽ quay về "Đang giao".`}
          </Typography>
          {deliveryConfirmDialog.order?.deliveryNote && (
            <Box sx={{ bgcolor: '#fffbeb', p: 1.5, borderRadius: 1.5, borderLeft: '3px solid #d97706', mt: 1.5 }}>
              <Typography variant="caption" color="#d97706" fontWeight={700}>GHI CHÚ SHIPPER:</Typography>
              <Typography variant="body2">{deliveryConfirmDialog.order.deliveryNote}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeliveryConfirmDialog({ open: false, order: null, action: '' })} variant="outlined" sx={{ borderRadius: 2 }}>Hủy</Button>
          <Button variant="contained"
            onClick={() => handleAdminDeliveryAction(deliveryConfirmDialog.order?.id, deliveryConfirmDialog.action)}
            sx={{
              borderRadius: 2, fontWeight: 700,
              bgcolor: deliveryConfirmDialog.action === 'confirm' ? '#059669' : '#dc2626',
              '&:hover': { bgcolor: deliveryConfirmDialog.action === 'confirm' ? '#047857' : '#b91c1c' }
            }}
          >
            {deliveryConfirmDialog.action === 'confirm' ? 'Xác nhận đã giao' : 'Từ chối'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialog Thống kê người dùng ── */}
      <Dialog open={openUserStatsDialog} onClose={() => setOpenUserStatsDialog(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #eee', mb: 2 }}>
          Thống kê người dùng
        </DialogTitle>
        <DialogContent>
          {userStatsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress sx={{ color: '#a2121e' }} /></Box>
          ) : selectedUserStats ? (
            <Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, bgcolor: '#a2121e', fontSize: 24 }}>{selectedUserStats.user.name?.charAt(0).toUpperCase()}</Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{selectedUserStats.user.name}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedUserStats.user.email} • {selectedUserStats.user.phone || 'Chưa có SĐT'}</Typography>
                  <Chip label={selectedUserStats.user.role === 'admin' ? 'Admin' : selectedUserStats.user.role === 'shipper' ? 'Shipper' : 'User'} size="small" sx={{ mt: 0.5, bgcolor: '#fce4e4', color: '#a2121e', fontWeight: 600 }} />
                </Box>
              </Box>

              {/* BUYER STATS */}
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#444' }}>📊 THỐNG KÊ MUA HÀNG (USER)</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#f8f9fa', boxShadow: 'none', border: '1px solid #eee', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>TỔNG ĐƠN ĐÃ ĐẶT</Typography>
                      <Typography variant="h5" fontWeight={800} color="#1a1a1a">{selectedUserStats.totalOrders}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#f0fdf4', boxShadow: 'none', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="#166534" fontWeight={600}>ĐƠN GIAO THÀNH CÔNG</Typography>
                      <Typography variant="h5" fontWeight={800} color="#15803d">{selectedUserStats.userDeliveredOrders}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#fffbeb', boxShadow: 'none', border: '1px solid #fde68a', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="#92400e" fontWeight={600}>TỔNG SẢN PHẨM ĐÃ MUA</Typography>
                      <Typography variant="h5" fontWeight={800} color="#b45309">{selectedUserStats.totalItemsBought}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: '#fef2f2', boxShadow: 'none', border: '1px solid #fecaca', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Typography variant="caption" color="#991b1b" fontWeight={600}>TỔNG TIỀN ĐÃ CHI</Typography>
                      <Typography variant="h6" fontWeight={800} color="#b91c1c">{formatPrice(selectedUserStats.totalSpent)}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* SHIPPER STATS */}
              {selectedUserStats.isShipper && (
                <>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#444' }}>🚚 THỐNG KÊ GIAO HÀNG (SHIPPER)</Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: '#f8f9fa', boxShadow: 'none', border: '1px solid #eee', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="text.secondary" fontWeight={600}>TỔNG ĐƠN ĐÃ NHẬN</Typography>
                          <Typography variant="h5" fontWeight={800} color="#1a1a1a">{selectedUserStats.totalAssigned}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: '#f0fdf4', boxShadow: 'none', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="#166534" fontWeight={600}>ĐÃ GIAO THÀNH CÔNG</Typography>
                          <Typography variant="h5" fontWeight={800} color="#15803d">{selectedUserStats.shipperDelivered}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: '#faf5ff', boxShadow: 'none', border: '1px solid #e9d5ff', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="#6b21a8" fontWeight={600}>ĐANG TRÊN ĐƯỜNG GIAO</Typography>
                          <Typography variant="h5" fontWeight={800} color="#7e22ce">{selectedUserStats.shipperDelivering}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={6}>
                      <Card sx={{ bgcolor: '#fffbeb', boxShadow: 'none', border: '1px solid #fde68a', borderRadius: 2 }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="#92400e" fontWeight={600}>CHƯA BẮT ĐẦU GIAO</Typography>
                          <Typography variant="h5" fontWeight={800} color="#b45309">{selectedUserStats.shipperPending}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* RECENT USER ORDERS */}
              {selectedUserStats.recentUserOrders.length > 0 && (
                <Box sx={{ mb: selectedUserStats.isShipper ? 3 : 0 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#444' }}>LỊCH SỬ MUA HÀNG GẦN ĐÂY</Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>ID</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Ngày</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Tổng tiền</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Trạng thái</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUserStats.recentUserOrders.map(o => (
                          <TableRow key={o.id}>
                            <TableCell>#{o.id}</TableCell>
                            <TableCell>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{formatPrice(o.totalAmount)}</TableCell>
                            <TableCell>
                              <Chip
                                label={o.status === 'delivered' ? 'Đã giao' : o.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                                color={o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'error' : 'warning'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* RECENT SHIPPER ORDERS */}
              {selectedUserStats.isShipper && selectedUserStats.recentShipperOrders.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#444' }}>LỊCH SỬ GIAO HÀNG GẦN ĐÂY</Typography>
                  <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#faf5ff' }}>
                        <TableRow>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>ID</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Ngày nhận</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Khách hàng</TableCell>
                          <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Trạng thái</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedUserStats.recentShipperOrders.map(o => (
                          <TableRow key={o.id}>
                            <TableCell>#{o.id}</TableCell>
                            <TableCell>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                            <TableCell>{o.User?.name || o.shippingAddress?.fullName || 'Khách hàng'}</TableCell>
                            <TableCell>
                              <Chip
                                label={o.status === 'delivered' ? 'Đã giao' : o.status === 'out_for_delivery' || o.status === 'delivery_confirmed' ? 'Đang giao' : 'Chờ lấy hàng'}
                                size="small"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                                color={o.status === 'delivered' ? 'success' : o.status === 'out_for_delivery' || o.status === 'delivery_confirmed' ? 'secondary' : 'default'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Box>
          ) : (
            <Typography align="center" color="text.secondary">Không có dữ liệu</Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setOpenUserStatsDialog(false)} variant="contained" sx={{ bgcolor: '#a2121e', '&:hover': { bgcolor: '#8b0000' } }}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Shipper Application Detail Dialog */}
      <Dialog open={openAppDialog} onClose={() => setOpenAppDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '24px', p: 1 } }}>
        <DialogTitle sx={{ fontWeight: 800, borderBottom: '1px solid #eee', mb: 2 }}>
          Chi tiết đăng ký Shipper
        </DialogTitle>
        <DialogContent>
          {selectedApp && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>TÊN NGƯỜI ĐĂNG KÝ</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.name}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>EMAIL LIÊN HỆ</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.email}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SĐT LIÊN HỆ</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.phone || 'Chưa cập nhật'}</Typography>
              </Box>
              
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" fontWeight={800} color="#a2121e">THÔNG TIN XÁC THỰC</Typography>
              
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>SỐ CMND/CCCD</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.applicationData?.cccd || 'Không có thông tin'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>LOẠI PHƯƠNG TIỆN</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.applicationData?.vehicleType || 'Không có thông tin'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>BIỂN SỐ XE</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.applicationData?.licensePlate || 'Không có thông tin'}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>KHU VỰC HOẠT ĐỘNG</Typography>
                <Typography variant="body1" fontWeight={500}>{selectedApp.applicationData?.area || 'Không có thông tin'}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenAppDialog(false)} sx={{ color: '#555' }}>Đóng</Button>
          {selectedApp && (
            <>
              <Button onClick={() => handleReviewShipperApp(selectedApp.id, 'reject')} variant="contained" color="error">
                Từ chối
              </Button>
              <Button onClick={() => handleReviewShipperApp(selectedApp.id, 'approve')} variant="contained" color="success">
                Duyệt
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog Xác nhận Xóa Đơn Hàng */}
      <Dialog
        open={deleteOrderConfirmDialog.open}
        onClose={() => setDeleteOrderConfirmDialog({ open: false, orderId: null })}
        PaperProps={{ sx: { borderRadius: 3, padding: 1, minWidth: 400 } }}
      >
        <DialogTitle sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
          Xác nhận xóa đơn hàng
        </DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng này không?</Typography>
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>Thao tác này không thể hoàn tác.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteOrderConfirmDialog({ open: false, orderId: null })}
            sx={{ color: '#666' }}
          >
            Hủy
          </Button>
          <Button
            onClick={handleDeleteOrderConfirm}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2 }}
          >
            Xóa vĩnh viễn
          </Button>
        </DialogActions>
      </Dialog>

      {/* Mobile Bottom Navigation */}
      <Box
        sx={{
          display: { xs: 'grid', md: 'none' },
          gridTemplateColumns: 'repeat(5, 1fr)',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: '#fff',
          borderTop: '1px solid #ece2e2',
          zIndex: 20,
          px: 0.5,
          py: 0.75
        }}
      >
        {adminNavItems.map((item) => {
          const active = tabValue === item.value;
          return (
            <Box
              key={item.value}
              onClick={() => setTabValue(item.value)}
              sx={{
                textAlign: 'center',
                py: 0.5,
                borderRadius: 1.5,
                color: active ? '#a10a12' : '#7b7b7b',
                bgcolor: active ? '#fbecec' : 'transparent',
                cursor: 'pointer'
              }}
            >
              {React.cloneElement(item.icon, { sx: { fontSize: 18 } })}
              <Typography sx={{ fontSize: '0.64rem', fontWeight: active ? 700 : 500, mt: 0.2 }}>
                {item.shortLabel}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default AdminPage;