from flask import Flask, request, jsonify, render_template_string
import sqlite3
import os

app = Flask(__name__)

# Инициализация базы данных пользователей
def initialize_database():
    connection = sqlite3.connect('user_records.db')
    cursor = connection.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL
        )
    ''')
    
    # Заполнение тестовыми учетными записями
    cursor.execute("INSERT OR IGNORE INTO users (id, username, email, password) VALUES (1, 'admin', 'admin@tselenko.local', 'adminSecret')")
    cursor.execute("INSERT OR IGNORE INTO users (id, username, email, password) VALUES (2, 'guest', 'guest@tselenko.local', 'guestSecret')")
    
    connection.commit()
    connection.close()

# Загрузка API-ключа из переменных окружения для защиты чувствительных данных
SECRET_API_KEY = os.environ.get('API_KEY')

if not SECRET_API_KEY:
    raise ValueError("API_KEY environment variable is not defined")

# Шаблон HTML с именем нового студента
MAIN_PAGE_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Управление базой данных пользователей</title>
</head>
<body>
    <h1>Панель управления пользователями (Целенко)</h1>
    <form action="/user" method="GET">
        <label>Идентификатор пользователя (ID):</label>
        <input type="text" name="id">
        <button type="submit">Получить данные</button>
    </form>
    
    <form action="/search" method="GET">
        <label>Поиск по имени пользователя:</label>
        <input type="text" name="username">
        <button type="submit">Найти</button>
    </form>
    
    <div id="output-box">
        {content}
    </div>
</body>
</html>
"""

@app.route('/')
def home_index():
    return render_template_string(MAIN_PAGE_TEMPLATE.format(content="<p>Введите ID или используйте форму поиска</p>"))

@app.route('/user')
def get_user_by_id():
    """Безопасный параметризованный запрос получения пользователя"""
    user_id = request.args.get('id')
    
    if not user_id:
        return jsonify({"error": "Параметр id отсутствует"}), 400
    
    connection = sqlite3.connect('user_records.db')
    cursor = connection.cursor()
    
    query = "SELECT * FROM users WHERE id = ?"
    cursor.execute(query, (user_id,))
    
    record = cursor.fetchone()
    connection.close()
    
    if record:
        return jsonify({"id": record[0], "username": record[1], "email": record[2]})
    return jsonify({"error": "Пользователь не найден"}), 404

@app.route('/search')
def search_users_by_name():
    """Безопасный поиск с параметризацией для предотвращения SQLi"""
    search_query = request.args.get('username', '')
    
    connection = sqlite3.connect('user_records.db')
    cursor = connection.cursor()
    
    query = "SELECT * FROM users WHERE username LIKE ?"
    cursor.execute(query, (f"%{search_query}%",))
    
    records = cursor.fetchall()
    connection.close()
    
    result = [{"id": r[0], "username": r[1], "email": r[2]} for r in records]
    return jsonify(result)

@app.route('/api/data')
def get_sensitive_data():
    """Безопасный доступ к конфиденциальным данным из окружения"""
    return jsonify({"api_key": SECRET_API_KEY, "status": "secured"})

@app.route('/execute')
def execute_permitted_command():
    """Запуск ограниченного набора системных утилит (allow-list)"""
    command_input = request.args.get('cmd', '')
    
    WHITE_LIST = ['echo', 'date', 'whoami']
    
    import subprocess
    tokens = command_input.split()
    if not tokens or tokens[0] not in WHITE_LIST:
        return jsonify({"error": "Запуск данной команды заблокирован политикой безопасности"}), 403
        
    try:
        execution_output = subprocess.check_output(tokens)
        return jsonify({"output": execution_output.decode()})
    except Exception as err:
        return jsonify({"error": str(err)}), 500

if __name__ == '__main__':
    initialize_database()
    app.run(port=5000)
