from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from pymongo import MongoClient

app = Flask(__name__)

# Configuración de conexión a MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://root:password@localhost/flask_app_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Configuración de conexión a MongoDB
client = MongoClient('mongodb://localhost:27017/')
mongo_db = client['flask_app_db']
mongo_collection = mongo_db['data_collection']

# Modelo para MySQL
class RelationalData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200), nullable=True)

    def __repr__(self):
        return f'<RelationalData {self.name}>'

# Rutas
@app.route('/')
def home():
    return "Bienvenido a la API Flask con MySQL y MongoDB"

# Endpoint para agregar datos a MySQL
@app.route('/add_mysql', methods=['POST'])
def add_to_mysql():
    data = request.json
    new_entry = RelationalData(name=data['name'], description=data.get('description'))
    db.session.add(new_entry)
    db.session.commit()
    return jsonify({"message": "Datos agregados a MySQL"}), 201

# Endpoint para agregar datos a MongoDB
@app.route('/add_mongo', methods=['POST'])
def add_to_mongo():
    data = request.json
    mongo_collection.insert_one(data)
    return jsonify({"message": "Datos agregados a MongoDB"}), 201

# Endpoint para obtener datos de MySQL
@app.route('/get_mysql', methods=['GET'])
def get_from_mysql():
    data = RelationalData.query.all()
    results = [{"id": item.id, "name": item.name, "description": item.description} for item in data]
    return jsonify(results), 200

# Endpoint para obtener datos de MongoDB
@app.route('/get_mongo', methods=['GET'])
def get_from_mongo():
    data = list(mongo_collection.find({}, {"_id": 0}))
    return jsonify(data), 200

if __name__ == '__main__':
    app.run(debug=True)
