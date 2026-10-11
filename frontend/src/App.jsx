import { Routes, Route } from 'react-router-dom';

const Inicio = () => <div>Inicio de la Tienda de Mochilas</div>;
const Catalogo = () => <div>Catálogo</div>;
const DetalleProducto = () => <div>Detalle de Producto</div>;
const Carrito = () => <div>Carrito</div>;
const Autenticacion = () => <div>Autenticación</div>;
const Registro = () => <div>Registro</div>;
const Checkout = () => <div>Proceso de Pago</div>;
const Confirmacion = () => <div>Confirmación y Resumen</div>;
const Contacto = () => <div>Contacto</div>;
const QuienesSomos = () => <div>Quiénes Somos</div>;
const Administracion = () => <div>Panel de Administración</div>;
const NoEncontrado = () => <div>404 - Página no encontrada</div>;

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/producto/:id" element={<DetalleProducto />} />
      <Route path="/carrito" element={<Carrito />} />
      <Route path="/login" element={<Autenticacion />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/confirmacion/:ordenId" element={<Confirmacion />} />
      <Route path="/contacto" element={<Contacto />} />
      <Route path="/quienes-somos" element={<QuienesSomos />} />
      <Route path="/admin/*" element={<Administracion />} />
      <Route path="*" element={<NoEncontrado />} />
    </Routes>
  );
}