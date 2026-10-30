import os
from pymongo import MongoClient, ASCENDING
from pymongo.errors import CollectionInvalid, OperationFailure, PyMongoError
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "catalogo_db")
COLLECTION_NAME = "productos"

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB_NAME]

# Esquema unificado: Combina tus requerimientos con las variables exactas del serializador de Sergio
PRODUCTO_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "sku",
            "nombre",
            "descripcion",
            "categoria_id",
            "precio",
            "stock_inicial",
            "moneda",
            "imagenes",
            "estado_activo"
        ],
        "properties": {
            "sku": {
                "bsonType": "string",
                "description": "Identificador inmutable del producto"
            },
            "nombre": {
                "bsonType": "string",
                "description": "Nombre comercial del producto"
            },
            "descripcion": {
                "bsonType": "string",
                "description": "Descripción detallada del producto"
            },
            "categoria_id": {
                "bsonType": "string",
                "description": "ID de la categoría enviada por el serializador"
            },
            "precio": {
                "bsonType": "int",
                "minimum": 1,
                "description": "Valor numérico entero estrictamente mayor a 0"
            },
            "stock_inicial": {
                "bsonType": "int",
                "minimum": 0,
                "description": "Unidades iniciales en bodega mayores o iguales a 0"
            },
            "moneda": {
                "bsonType": "string",
                "description": "Código de moneda (ej. CLP)"
            },
            "imagenes": {
                "bsonType": "array",
                "items": {
                    "bsonType": "string"
                },
                "description": "Lista de URLs de imágenes del producto"
            },
            "estado_activo": {
                "bsonType": "bool",
                "description": "Estado de disponibilidad en el catálogo"
            }
        }
    }
}

def get_mongo_db():
    return db

def get_productos_collection():
    return db[COLLECTION_NAME]

def inicializar_coleccion_productos():
    """Configura la validación BSON estricta y los índices en MongoDB Atlas."""
    try:
        if COLLECTION_NAME not in db.list_collection_names():
            db.create_collection(COLLECTION_NAME, validator=PRODUCTO_VALIDATOR)
        else:
            db.command({
                "collMod": COLLECTION_NAME,
                "validator": PRODUCTO_VALIDATOR,
                "validationLevel": "strict"
            })
        
        # El índice se aplica sobre el 'sku' para garantizar que no existan duplicados
        db[COLLECTION_NAME].create_index([("sku", ASCENDING)], unique=True)
        return True, "Colección 'productos' y esquema configurados correctamente."
    except (CollectionInvalid, OperationFailure, PyMongoError) as e:
        return False, f"Error al configurar la colección en MongoDB: {str(e)}"

def check_mongo_connection():
    try:
        client.admin.command("ping")
        return True, "Conexion exitosa a MongoDB Atlas"
    except Exception as e:
        return False, str(e)