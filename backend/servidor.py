print("Iniciando...")

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import database as db

app = Flask(__name__)
CORS(app)

#carpeta carga de imagenes
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
EXTENSIONES_PERMITIDAS = {'png', 'jpg', 'jpeg', 'webp'}

def extension_permitida(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in EXTENSIONES_PERMITIDAS

def guardar_imagen(archivo):
    """Guarda la imagen en uploads/ y retorna la ruta relativa."""
    if archivo and extension_permitida(archivo.filename):
        nombre = secure_filename(archivo.filename)
        ruta   = os.path.join(app.config['UPLOAD_FOLDER'], nombre)
        archivo.save(ruta)
        return f"uploads/{nombre}"
    return None


#materiales

@app.route('/materiales', methods=['GET'])
def listar_materiales():
    try:
        materiales = db.get_materiales()
        return jsonify(materiales), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/materiales', methods=['POST'])
def agregar_material():
    try:
        nombre = request.form.get('nombre', '').strip()
        precio = request.form.get('precio')
        imagen = request.files.get('imagen')

        if not nombre or not precio:
            return jsonify({'error': 'Nombre y precio son obligatorios'}), 400

        ruta_imagen = guardar_imagen(imagen)
        nuevo_id    = db.crear_material(nombre, float(precio), ruta_imagen)

        return jsonify({'id': nuevo_id, 'mensaje': 'Material creado'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/materiales/<int:id>', methods=['PUT'])
def editar_material(id):
    try:
        nombre = request.form.get('nombre', '').strip()
        precio = request.form.get('precio')
        imagen = request.files.get('imagen')

        if not nombre or not precio:
            return jsonify({'error': 'Nombre y precio son obligatorios'}), 400

        ruta_imagen = guardar_imagen(imagen)
        db.actualizar_material(id, nombre, float(precio), ruta_imagen)

        return jsonify({'mensaje': 'Material actualizado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/materiales/<int:id>', methods=['DELETE'])
def eliminar_material(id):
    try:
        db.eliminar_material(id)
        return jsonify({'mensaje': 'Material eliminado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


#lavaplatos

@app.route('/lavaplatos', methods=['GET'])
def listar_lavaplatos():
    try:
        lavaplatos = db.get_lavaplatos()
        return jsonify(lavaplatos), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/lavaplatos', methods=['POST'])
def agregar_lavaplatos():
    try:
        nombre = request.form.get('nombre', '').strip()
        precio = request.form.get('precio')
        imagen = request.files.get('imagen')

        if not nombre or not precio:
            return jsonify({'error': 'Nombre y precio son obligatorios'}), 400

        ruta_imagen = guardar_imagen(imagen)
        nuevo_id    = db.crear_lavaplatos(nombre, float(precio), ruta_imagen)

        return jsonify({'id': nuevo_id, 'mensaje': 'Lavaplatos creado'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/lavaplatos/<int:id>', methods=['PUT'])
def editar_lavaplatos(id):
    try:
        nombre = request.form.get('nombre', '').strip()
        precio = request.form.get('precio')
        imagen = request.files.get('imagen')

        if not nombre or not precio:
            return jsonify({'error': 'Nombre y precio son obligatorios'}), 400

        ruta_imagen = guardar_imagen(imagen)
        db.actualizar_lavaplatos(id, nombre, float(precio), ruta_imagen)

        return jsonify({'mensaje': 'Lavaplatos actualizado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/lavaplatos/<int:id>', methods=['DELETE'])
def eliminar_lavaplatos(id):
    try:
        db.eliminar_lavaplatos(id)
        return jsonify({'mensaje': 'Lavaplatos eliminado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# config

@app.route('/config', methods=['GET'])
def obtener_config():
    try:
        config = db.get_config()
        return jsonify({
            'manoObra':    config.get('mano_obra',    200000),
            'precioHueco': config.get('hueco',        100000),
            'transpCerca': config.get('transp_cerca', 100000),
            'transpLejos': config.get('transp_lejos', 200000),
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/config', methods=['PUT'])
def guardar_config():
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se recibieron datos'}), 400

        mapeo = {
            'manoObra':    'mano_obra',
            'precioHueco': 'hueco',
            'transpCerca': 'transp_cerca',
            'transpLejos': 'transp_lejos',
        }

        for campo_js, campo_db in mapeo.items():
            if campo_js in datos:
                db.actualizar_config(campo_db, float(datos[campo_js]))

        return jsonify({'mensaje': 'Configuracion guardada'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

#historial

@app.route('/historial', methods=['GET'])
def listar_historial():
    try:
        historial = db.get_historial()
        # Convertir fechas a string para que JSON las pueda serializar
        for h in historial:
            if h.get('fecha'):
                h['fecha'] = h['fecha'].strftime('%d/%m/%Y %H:%M')
        return jsonify(historial), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/historial', methods=['POST'])
def crear_historial():
    try:
        datos = request.get_json()
        if not datos:
            return jsonify({'error': 'No se recibieron datos'}), 400

        db.guardar_historial(datos)
        return jsonify({'mensaje': 'Calculo guardado en historial'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/historial/<int:id>', methods=['DELETE'])
def borrar_historial(id):
    try:
        db.eliminar_historial(id)
        return jsonify({'mensaje': 'Registro eliminado'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/uploads/<nombre_archivo>')
def servir_imagen(nombre_archivo):
    from flask import send_from_directory
    return send_from_directory(app.config['UPLOAD_FOLDER'], nombre_archivo)


if __name__ == '__main__':
    print("Iniciando servidor en http://localhost:5000")
    db.crear_tablas()
    app.run(debug=True, port=5000)