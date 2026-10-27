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

def setup_mongo_validators():
    """Configura validaciones estructurales de esquema en MongoDB Atlas."""
    validator = {
        "$jsonSchema": {
            "bsonType": "object",
            "required": ["name", "price", "stock_fisico", "status"],
            "properties": {
                "name": {
                    "bsonType": "string",
                    "description": "El nombre es obligatorio y de tipo string"
                },
                "price": {
                    "bsonType": "int",
                    "minimum": 1,
                    "description": "El precio debe ser un entero positivo mayor a 0"
                },
                "stock_fisico": {
                    "bsonType": "int",
                    "minimum": 0,
                    "description": "El stock fisico debe ser un entero mayor o igual a 0"
                },
                "stock_reservado": {
                    "bsonType": "int",
                    "minimum": 0,
                    "description": "El stock reservado debe ser un entero mayor o igual a 0"
                },
                "currency": {
                    "bsonType": "string"
                },
                "status": {
                    "enum": ["draft", "published", "inactive"]
                }
            }
        }
    }
    try:
        # Aplica o actualiza las reglas de validación en la colección
        db.command("collMod", "productos", validator=validator)
        return True, "Validador estructural aplicado con exito en MongoDB"
    except Exception:
        try:
            # Si la colección no existía con validador, la crea con las reglas
            db.create_collection("productos", validator=validator)
            return True, "Coleccion productos creada con validador estructural"
        except Exception as e:
            return False, str(e)
