from catalogo_core.db_mongo import get_productos_collection
from pymongo.errors import PyMongoError

def ejecutar_insercion_prueba():
    coleccion = get_productos_collection()
    
    producto_prueba = {
        "sku": "MCH-URB-001",
        "nombre": "Mochila Urbana Resistente",
        "descripcion": "Mochila ideal para el entorno universitario con compartimento para laptop.",
        "categoria_id": "CAT-URB",
        "precio": 45000,
        "stock_inicial": 25,
        "moneda": "CLP",
        "imagenes": ["url_imagen_1.jpg", "url_imagen_2.jpg"],
        "estado_activo": True
    }
    
    try:
        resultado = coleccion.insert_one(producto_prueba)
        print(f"Éxito: Documento insertado correctamente en MongoDB Atlas con ID: {resultado.inserted_id}")
    except PyMongoError as e:
        print(f"Error algorítmico o de validación BSON: {str(e)}")

if __name__ == "__main__":
    ejecutar_insercion_prueba()