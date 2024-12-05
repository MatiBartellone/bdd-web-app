import json
from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from pymongo import MongoClient
from bson.objectid import ObjectId

with open('config.json') as config_file:
    config = json.load(config_file)

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = (
    f"mysql+pymysql://{config['mysql']['user']}:{config['mysql']['password']}@"
    f"{config['mysql']['host']}/{config['mysql']['database']}"
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

client = MongoClient(f"mongodb://{config['mongodb']['host']}:{config['mongodb']['port']}/")
mongo_db = client[config['mongodb']['database']]
mongo_collection = mongo_db[config['mongodb']['collection']]


class RelationalData(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.String(200), nullable=True)

    def __repr__(self):
        return f'<RelationalData {self.name}>'

@app.route('/')
def home():
    return render_template('index.html')  # Renderiza el archivo index.html en la carpeta templates

# Endpoint para agregar datos a MySQL
@app.route('/add_mysql', methods=['POST'])
def add_to_mysql():
    data = request.json
    print(data)  # Agrega este print para ver los datos que llegan
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
    data = list(mongo_collection.find({}))
    for record in data:
        record['_id'] = str(record['_id'])
    return jsonify(data), 200

@app.route('/get_mongo/<string:id>', methods=['GET'])
def get_mongo(id):
    try:
        record = mongo_collection.find_one({'_id': ObjectId(id)})
        if record:
            record['_id'] = str(record['_id'])
            return jsonify(record), 200
        else:
            return jsonify({"message": "Registro no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# Endpoint para actualizar datos de MySQL
@app.route('/update_mysql/<int:id>', methods=['PUT'])
def update_mysql(id):
    data = request.json
    record = RelationalData.query.get(id)
    if record:
        record.name = data['name']
        record.description = data.get('description')
        db.session.commit()
        return jsonify({"message": "Registro actualizado"}), 200
    return jsonify({"message": "Registro no encontrado"}), 404

@app.route('/update_mongo/<string:id>', methods=['PUT'])
def update_mongo(id):
    if not ObjectId.is_valid(id):
        return jsonify({"error": "ID no válido"}), 400
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No se proporcionaron datos para actualizar"}), 400
        result = mongo_collection.update_one({'_id': ObjectId(id)}, {'$set': data})
        if result.matched_count > 0:
            return jsonify({"message": "Registro actualizado"}), 200
        else:
            return jsonify({"message": "Registro no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": f"Error al actualizar el registro: {str(e)}"}), 500

# Endpoint para eliminar datos de MySQL
@app.route('/delete_mysql/<int:id>', methods=['DELETE'])
def delete_mysql(id):
    record = RelationalData.query.get(id)
    if record:
        db.session.delete(record)
        db.session.commit()
        return jsonify({"message": "Registro eliminado"}), 200
    return jsonify({"message": "Registro no encontrado"}), 404

# Endpoint para eliminar datos de MongoDB
@app.route('/delete_mongo/<string:id>', methods=['DELETE'])
def delete_mongo(id):
    try:
        result = mongo_collection.delete_one({'_id': ObjectId(id)})
        if result.deleted_count > 0:
            return jsonify({"message": "Registro eliminado"}), 200
        return jsonify({"message": "Registro no encontrado"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True)
