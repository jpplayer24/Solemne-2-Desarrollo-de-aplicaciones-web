# backend_catalogo/seed_db.py
import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Cargar variables de entorno locales (.env)
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "catalogo_db")

def inserciondedatos():
    if not MONGO_URI:
        print("Error: MONGO_URI no está configurada en el .env")
        return

    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGO_DB_NAME]
    coleccion = db["productos"]

    
    prueba = [
        {
            "name": "Mochila Urbana",
            "description": "Mochila con un alto estilo",
            "category_id": "urbanas",
            "precio": 45990,

            "stock_fisico": 15,
            "stock_reservado": 0,
            
        },
        {
            "name": "Mochila triple bolsillo",
            "description": "Mochila con triple bolsillo para accesorios.",
            "category_id": "viaje",
            "precio": 89990,
            "stock_fisico": 8,
            "stock_reservado": 0,
            
        }
    ]

    try:
        #borrar coleccion si existe alguna
        coleccion.delete_many({})
        
        resultado = coleccion.insert_many(prueba)
        print(f" Éxito: Se insertaron {len(resultado.inserted_ids)} mochilas iniciales en MongoDB Atlas.")
    except Exception as e:
        print(f"Error al escribir en MongoDB Atlas: {e}")

if __name__ == "__main__":
    inserciondedatos()