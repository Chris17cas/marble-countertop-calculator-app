import os
import psycopg2
from psycopg2.extras import RealDictCursor
from urllib.parse import quote_plus
from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

DB_HOST     = os.getenv('DB_HOST',     'localhost')
DB_PORT     = os.getenv('DB_PORT',     '5432')
DB_NAME     = os.getenv('DB_NAME',     'mesones_db')
DB_USER     = os.getenv('DB_USER',     'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')

password     = quote_plus(DB_PASSWORD)
DATABASE_URL = f"postgresql://{DB_USER}:{password}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

def get_conn():
    return psycopg2.connect(DATABASE_URL)


def crear_tablas():
    sql = """
    CREATE TABLE IF NOT EXISTS materiales (
        id        SERIAL PRIMARY KEY,
        nombre    VARCHAR(100) NOT NULL,
        precio    NUMERIC(10,2) NOT NULL,
        imagen    TEXT,
        activo    BOOLEAN DEFAULT TRUE,
        creado_en TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS lavaplatos (
        id         SERIAL PRIMARY KEY,
        nombre     VARCHAR(100) NOT NULL,
        precio     NUMERIC(10,2) NOT NULL,
        imagen     TEXT,
        es_ninguno BOOLEAN DEFAULT FALSE,
        activo     BOOLEAN DEFAULT TRUE,
        creado_en  TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(50) PRIMARY KEY,
        valor NUMERIC(10,2) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS historial (
        id           SERIAL PRIMARY KEY,
        fecha        TIMESTAMP DEFAULT NOW(),
        tipo_meson   VARCHAR(50),
        material     VARCHAR(100),
        m2           NUMERIC(10,3),
        ml           NUMERIC(10,3),
        precio_mat   NUMERIC(10,2),
        costo_mo     NUMERIC(10,2),
        costo_lava   NUMERIC(10,2),
        costo_hueco  NUMERIC(10,2),
        costo_angulo NUMERIC(10,2),
        costo_transp NUMERIC(10,2),
        total        NUMERIC(10,2)
    );
    """
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(sql)
    conn.commit()
    cur.close()
    conn.close()
    print("[DB] Tablas verificadas correctamente.")


def insertar_datos_iniciales():
    conn = get_conn()
    cur  = conn.cursor()

    cur.execute("SELECT COUNT(*) FROM materiales")
    if cur.fetchone()[0] == 0:
        materiales = [
            ('Marmol',  300000.00),
            ('Granito',  400000.00),
            ('quarzstone',    500000.00),

        ]
        cur.executemany(
            "INSERT INTO materiales (nombre, precio) VALUES (%s, %s)",
            materiales
        )
        print("[DB] Materiales iniciales insertados.")

    cur.execute("SELECT COUNT(*) FROM lavaplatos")
    if cur.fetchone()[0] == 0:
        lavaplatos = [
            ('Sin lavaplatos',        0.00,  True),
            ('sencillo empotrar',     150000.00, False),
            ('sencillo submontar',  200000.00, False),
           
        ]
        cur.executemany(
            "INSERT INTO lavaplatos (nombre, precio, es_ninguno) VALUES (%s, %s, %s)",
            lavaplatos
        )
        print("[DB] Lavaplatos iniciales insertados.")

    cur.execute("SELECT COUNT(*) FROM configuracion")
    if cur.fetchone()[0] == 0:
        config = [
            ('mano_obra',    200000.00),
            ('hueco',        100000.00),
            ('transp_cerca', 100000.00),
            ('transp_lejos', 200000.00),
        ]
        cur.executemany(
            "INSERT INTO configuracion (clave, valor) VALUES (%s, %s)",
            config
        )
        print("[DB] Configuracion inicial insertada.")

    conn.commit()
    cur.close()
    conn.close()


def get_materiales():
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM materiales WHERE activo = TRUE ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in rows]

def get_material(id):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM materiales WHERE id = %s", (id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None

def crear_material(nombre, precio, imagen=None):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "INSERT INTO materiales (nombre, precio, imagen) VALUES (%s, %s, %s) RETURNING id",
        (nombre, precio, imagen)
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return nuevo_id

def actualizar_material(id, nombre, precio, imagen=None):
    conn = get_conn()
    cur  = conn.cursor()
    if imagen:
        cur.execute(
            "UPDATE materiales SET nombre=%s, precio=%s, imagen=%s WHERE id=%s",
            (nombre, precio, imagen, id)
        )
    else:
        cur.execute(
            "UPDATE materiales SET nombre=%s, precio=%s WHERE id=%s",
            (nombre, precio, id)
        )
    conn.commit()
    cur.close()
    conn.close()

def eliminar_material(id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("UPDATE materiales SET activo = FALSE WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()


def get_lavaplatos():
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM lavaplatos WHERE activo = TRUE ORDER BY id")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in rows]

def get_un_lavaplatos(id):
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM lavaplatos WHERE id = %s", (id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None

def crear_lavaplatos(nombre, precio, imagen=None):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "INSERT INTO lavaplatos (nombre, precio, imagen) VALUES (%s, %s, %s) RETURNING id",
        (nombre, precio, imagen)
    )
    nuevo_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return nuevo_id

def actualizar_lavaplatos(id, nombre, precio, imagen=None):
    conn = get_conn()
    cur  = conn.cursor()
    if imagen:
        cur.execute(
            "UPDATE lavaplatos SET nombre=%s, precio=%s, imagen=%s WHERE id=%s",
            (nombre, precio, imagen, id)
        )
    else:
        cur.execute(
            "UPDATE lavaplatos SET nombre=%s, precio=%s WHERE id=%s",
            (nombre, precio, id)
        )
    conn.commit()
    cur.close()
    conn.close()

def eliminar_lavaplatos(id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("UPDATE lavaplatos SET activo = FALSE WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()


def get_config():
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT clave, valor FROM configuracion")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return {r['clave']: float(r['valor']) for r in rows}

def actualizar_config(clave, valor):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute(
        "UPDATE configuracion SET valor = %s WHERE clave = %s",
        (valor, clave)
    )
    conn.commit()
    cur.close()
    conn.close()


def get_historial():
    conn = get_conn()
    cur  = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM historial ORDER BY fecha DESC")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in rows]

def guardar_historial(datos):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("""
        INSERT INTO historial
            (tipo_meson, material, m2, ml, precio_mat,
             costo_mo, costo_lava, costo_hueco, costo_angulo, costo_transp, total)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        datos.get('tipo_meson'),
        datos.get('material'),
        datos.get('m2'),
        datos.get('ml'),
        datos.get('precio_mat'),
        datos.get('costo_mo'),
        datos.get('costo_lava'),
        datos.get('costo_hueco'),
        datos.get('costo_angulo'),
        datos.get('costo_transp'),
        datos.get('total'),
    ))
    conn.commit()
    cur.close()
    conn.close()

def eliminar_historial(id):
    conn = get_conn()
    cur  = conn.cursor()
    cur.execute("DELETE FROM historial WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()


if __name__ == '__main__':
    crear_tablas()
    insertar_datos_iniciales()
