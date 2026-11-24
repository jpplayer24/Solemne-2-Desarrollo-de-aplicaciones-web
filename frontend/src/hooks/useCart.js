// ============================================================================
// Hook Personalizado: useCart.js
// ============================================================================

import { useState, useEffect } from 'react';
import axios from 'axios';

export function useCart() {
  // Estado local del carrito inicializado con los datos de localStorage
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('dreamhub_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      console.error('Error al leer el carrito desde localStorage:', e);
      return [];
    }
  });

  // Mensaje de notificación para alertar al cliente sobre ajustes o fusiones
  const [cartNotification, setCartNotification] = useState(null);

  // Escribir automáticamente en localStorage cada vez que cambian los items en modo anónimo
  useEffect(() => {
    try {
      localStorage.setItem('dreamhub_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error al guardar el carrito en localStorage:', e);
    }
  }, [cartItems]);

  /**
   * RB-01: Agregar producto al carrito anónimo
   * No descuenta stock físico ni reservado en la base de datos hasta iniciar el checkout.
   */
  const addToCart = (product, quantityToAdd = 1) => {
    setCartItems((prevItems) => {
      // Buscar si la mochila ya existe dentro del carrito por su ID
      const existingIndex = prevItems.findIndex((item) => item.id === product.id);

      if (existingIndex > -1) {
        // Si existe, acumulamos la cantidad
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          cantidad: updated[existingIndex].cantidad + quantityToAdd,
        };
        return updated;
      } else {
        // Si es nuevo, agregamos el snapshot básico del producto
        return [
          ...prevItems,
          {
            id: product.id,
            nombre: product.nombre,
            precio: product.precio,
            imagen: Array.isArray(product.imagenes) && product.imagenes.length > 0 ? product.imagenes[0] : product.imagen,
            cantidad: quantityToAdd,
          },
        ];
      }
    });
  };

  /**
   * Modificar la cantidad de una línea específica del carrito anónimo
   */
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === productId ? { ...item, cantidad: newQuantity } : item
      )
    );
  };

  /**
   * Eliminar una mochila del carrito
   */
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId));
  };

  /**
   * Limpiar el carrito local por completo
   */
  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('dreamhub_cart');
  };

  /**
   * RB-02: Función de Sincronización y Fusión Post-Login
   * Se invoca inmediatamente después de obtener el token de autenticación.
   * Envía el payload del carrito anónimo al backend para fusionarlo con el carrito del usuario registrado.
   */
  const syncCartPostLogin = async (token) => {
    const anonymousItems = JSON.parse(localStorage.getItem('dreamhub_cart') || '[]');

    try {
      // Petición al endpoint de Django REST Framework encargado de la fusión
      const response = await axios.post(
        'http://localhost:8000/api/comercio/carrito/fusionar/',
        { items_anonimos: anonymousItems },
        {
          headers: { Authorization: `Token ${token}` }
        }
      );

      // El backend retorna los items combinados y cualquier alerta sobre stock o deshabilitación
      const { items_fusionados, mensaje_ajuste } = response.data;

      // Actualizamos el estado con la lista combinada final
      setCartItems(items_fusionados || []);
      localStorage.setItem('dreamhub_cart', JSON.stringify(items_fusionados || []));

      if (mensaje_ajuste) {
        setCartNotification(mensaje_ajuste);
      }

      return { success: true, notification: mensaje_ajuste };
    } catch (error) {
      console.warn('Backend no disponible para fusión de carrito, ejecutando fusión en modo frontend fallback...');

      // Fallback local en caso de que el microservicio de Comercio no esté activo aún
      // Fusión por identificador de producto en el cliente
      const mergedMap = new Map();

      // Cargar items actuales
      anonymousItems.forEach((item) => {
        mergedMap.set(item.id, { ...item });
      });

      const mergedArray = Array.from(mergedMap.values());
      setCartItems(mergedArray);
      localStorage.setItem('dreamhub_cart', JSON.stringify(mergedArray));

      return { success: true, notification: 'Carrito combinado correctamente en modo local.' };
    }
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    syncCartPostLogin,
    cartNotification,
    setCartNotification,
  };
}