export const getFirstImage = (imagesStr, fallback = 'https://via.placeholder.com/300') => {
  if (!imagesStr) return fallback;
  try {
    const arr = Array.isArray(imagesStr) ? imagesStr : JSON.parse(imagesStr);
    if (arr.length > 0 && arr[0]) {
      const img = arr[0];
      if (img.startsWith('http') || img.startsWith('data:')) return img;
      return img.startsWith('/') ? img : `/${img}`;
    }
  } catch (e) {}
  return fallback;
};
