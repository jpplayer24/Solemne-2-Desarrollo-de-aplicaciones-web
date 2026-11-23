from catalogo_core.db_mongo import get_productos_collection

#Coleccion exclusiva para las pruebas de Locust.
coleccion = get_productos_collection()

productos = []

# Generar 100 mochilas de prueba.
for i in range(1, 101):
    producto = {
        "sku": f"MCH-TEST-{i:03d}",
        'nombre': f"Mochila de Prueba {i}",
        "descripcion": f"Mochila de prueba numero {i} para evaluar el rendimiento del catalogo.",
        "categoria_id": "CAT-TEST",
        "precio": 25000 + (i * 100),
        "stock_inicial": 10 + i,
        "stock_reservado": 0,
        "moneda": "CLP",
        "capacidad_litros": 20 + (i % 30),
        "badge": "Test",
        "imagenes": [
            "https://example.com/mochila-test-1.jpg",
            "https://example.com/mochila-test-2.jpg",
            "https://example.com/mochila-test-3.jpg",
            "https://example.com/mochila-test-4.jpg"
        ],
        "estado_activo": True
    }
    productos.append(producto)

# Insertar los 100 productos de prueba en MongoDB.
resultado = coleccion.insert_many(productos, ordered=False)

print(f"Productos insertados: {len(resultado.inserted_ids)}")
print(f"Total de productos en la coleccion: {coleccion.count_documents({})}")