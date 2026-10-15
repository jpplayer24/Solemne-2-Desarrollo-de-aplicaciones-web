import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "catalogo_db")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB_NAME]

def get_mongo_db():
    return db

def check_mongo_connection():
    try:
        client.admin.command('ping')
        return True, "Conexion exitosa a MongoDB "
    except Exception as e:
        return False, str(e)