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

PRODUCTO_VALIDATOR = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": [
            "id",
            "nombre",
            "descripcion",
            "precio",
            "moneda",
            "stock_fisico",
            "stock_reservado",
            "imagenes",
            "estado_activo"
        ],
        "properties": {
            "id": {
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
            "precio": {
                "bsonType": ["int", "double", "decimal"],
                "description": "Valor numérico del producto"
            },
            "moneda": {
                "bsonType": "string",
                "description": "Código de moneda (ej. CLP, USD)"
            },
            "stock_fisico": {
                "bsonType": "int",
                "description": "Unidades físicas en bodega"
            },
            "stock_reservado": {
                "bsonType": "int",
                "description": "Unidades retenidas en órdenes activas"
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
    try:
        if COLLECTION_NAME not in db.list_collection_names():
            db.create_collection(COLLECTION_NAME, validator=PRODUCTO_VALIDATOR)
        else:
            db.command({
                "collMod": COLLECTION_NAME,
                "validator": PRODUCTO_VALIDATOR,
                "validationLevel": "strict"
            })
        
        db[COLLECTION_NAME].create_index([("id", ASCENDING)], unique=True)
        return True, "Colección 'productos' y esquema configurados correctamente."
    except (CollectionInvalid, OperationFailure, PyMongoError) as e:
        return False, f"Error al configurar la colección en MongoDB: {str(e)}"

def check_mongo_connection():
    try:
        client.admin.command("ping")
        return True, "Conexion exitosa a MongoDB"
    except Exception as e:
        return False, str(e)