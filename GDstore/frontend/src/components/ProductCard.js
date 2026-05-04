import React from 'react';
import { 
  Card, CardMedia, CardContent, CardActions, 
  Typography, Button, Box, Rating, Chip, IconButton
} from '@mui/material';
import { Favorite, FavoriteBorder, ShoppingCart, LocalShipping } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';
import { getFirstImage } from '../utils/imageUtils';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isFav, setIsFav] = useState(false);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price).replace('₫', 'đ');
  };

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const result = await addToCart(product.id, 1);
    if (result.success) {
      alert('Đã thêm vào giỏ hàng!');
    }
  };

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      borderRadius: 2,
      border: 'none',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      transition: 'all 0.25s ease',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        '& .product-actions': { opacity: 1 }
      }
    }}>
      {/* Favorite */}
      <IconButton
        size="small"
        sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1, bgcolor: 'rgba(255,255,255,0.9)', width: 30, height: 30 }}
        onClick={(e) => { e.stopPropagation(); setIsFav(!isFav); }}
      >
        {isFav
          ? <Favorite sx={{ fontSize: 16 }} color="error" />
          : <FavoriteBorder sx={{ fontSize: 16 }} />
        }
      </IconButton>

      {/* Sale badge */}
      {product.isFlashSale && (
        <Chip label="-20%" size="small" sx={{
          position: 'absolute', top: 6, left: 6,
          bgcolor: '#c62828', color: 'white',
          fontWeight: 700, fontSize: '0.65rem', height: 20, zIndex: 1, borderRadius: 1
        }} />
      )}

      {/* Image */}
      <Box sx={{ 
        bgcolor: '#fff', 
        borderRadius: '8px 8px 0 0', 
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '1/1',
        borderBottom: '1px solid #f0f0f0'
      }}
        onClick={() => navigate(`/product/${product.id}`)}>
        <CardMedia
          component="img"
          image={getFirstImage(product.images, 'https://via.placeholder.com/200')}
          alt={product.name}
          sx={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover', 
            transition: 'transform 0.3s', 
            '&:hover': { transform: 'scale(1.05)' } 
          }}
        />
      </Box>

      {/* Content */}
      <CardContent sx={{ flexGrow: 1, p: '10px 10px 8px !important' }}>
        {/* Rating */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <Rating value={4.5} size="small" readOnly sx={{ fontSize: '0.85rem', color: '#ffc107' }} />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.7rem' }}>(42)</Typography>
        </Box>

        {/* Name */}
        <Typography
          variant="body2"
          fontWeight={600}
          sx={{
            mb: 0.5, overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            color: '#333', lineHeight: 1.4, minHeight: '2.8em',
            cursor: 'pointer', '&:hover': { color: '#c62828' }
          }}
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {product.name}
        </Typography>

        {/* Price */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography variant="body1" sx={{ color: '#c62828', fontWeight: 700, fontSize: '0.95rem' }}>
            {product.isFlashSale ? formatPrice(product.price * 0.8) : formatPrice(product.price)}
          </Typography>
          {product.isFlashSale && (
            <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled' }}>
              {formatPrice(product.price)}
            </Typography>
          )}
        </Box>

        {/* Shipping */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
          <LocalShipping sx={{ fontSize: 13, color: '#00a650' }} />
          <Typography variant="caption" color="#00a650" sx={{ fontSize: '0.68rem' }}>Miễn phí vận chuyển</Typography>
        </Box>
      </CardContent>

      {/* Hover add-to-cart */}
      <Box className="product-actions" sx={{ px: 1, pb: 1, opacity: 0, transition: 'opacity 0.25s' }}>
        <Button
          fullWidth variant="contained" size="small"
          startIcon={<ShoppingCart sx={{ fontSize: '0.9rem' }} />}
          onClick={(e) => { e.stopPropagation(); handleAddToCart(); }}
          disabled={product.stock === 0}
          sx={{ bgcolor: '#c62828', fontSize: '0.75rem', py: 0.6, borderRadius: 1, '&:hover': { bgcolor: '#b71c1c' } }}
        >
          {product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
        </Button>
      </Box>
    </Card>
  );
};

export default ProductCard;