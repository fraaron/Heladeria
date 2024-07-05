//Libreria de Express
const express = require('express');
//Libreria Path
const path = require('path');
const multer = require('multer');

//Libreria Mysql
const mysql = require('mysql');
const app = express();

const upload = multer({dest: 'imagenes/'});

const port = 3000;
// Configurar la conexión a la base de datos
const connection = mysql.createConnection({
    host: '10.0.6.39',
    user: 'estudiante',
    password: 'Info-2023',
    database: 'HeladeriaMF'
});
//Verificacion de errores para validar si la conexion es correcta
connection.connect((err) => {
    if (err) {
        console.error('Error de conexión a la base de datos: ' + err.stack);
        return;
    }
    console.log('Conexión exitosa a la base de datos.');
});
//Envio los datos del formulario por url
app.use(express.urlencoded({ extended: true }));
//Convierto en formato json
app.use(express.json());
//Configuro para que la aplicacon inicie desde el director o carpeta pagina principal
app.use(express.static(path.join(__dirname, 'pagina_principal')));
//Recibo los valores y los envio a la tabla
app.post('/guardar_helado',(req, res) => {
    const { nombre, descripcion, sabor, tipo, cobertura, precio } = req.body;
    const sql = 'INSERT INTO Helado (nombre, descripcion, sabor, tipo, cobertura, precio) VALUES (?, ?, ?, ?, ?, ?)';
    connection.query(sql, [nombre, descripcion, sabor, tipo, cobertura, precio], (err, result) => {
        if (err) throw err;
        console.log('Helado insertada correctamente.');
        res.redirect('/listardatos.html');
    });
});
//Ruta para mostrar los helados en el listardatos.html con metodo GET
app.get('/helados', (req, res) => {
    //Realiza una consulta SQL para seleccionar todas las filas de la tabla "helados"
    connection.query('SELECT * FROM Helado', (err, rows) => {
        //Maneja los errores, si los hay
        if (err) throw err;
        res.send(rows); //Aquí puedes enviar la respuesta como quieras (por ejemplo, renderizar un HTML o enviar un JSON)
    });
});
// Ruta para obtener los datos del helado por su ID
app.get('/helados/:id', (req, res) => {
    const { id } = req.params;

    const query = 'SELECT * FROM Helado WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al obtener los detalles del helado:', err);
            res.status(500).send('Error al obtener los detalles del helado');
        } else {
            res.json(result[0]);
        }
    });
});
// Ruta para manejar el registro de usuario
app.post('/registrar_usuario', (req, res) => {
    const { correo, contraseña, rol } = req.body;

    const query = 'INSERT INTO HeladeriaUsuarios (correo, contraseña, rol) VALUES (?, ?, ?)';
    connection.query(query, [correo, contraseña, rol], (err, result) => {
        if (err) {
            console.error('Error al registrar el usuario:', err);
            res.send('Error al registrar el usuario');
        } else {
            console.log('Usuario registrado exitosamente:');
            res.redirect('/index.html');
        }
    });
});

// Ruta para manejar el inicio de sesión
app.post('/iniciar_sesion', (req, res) => { // Define una ruta POST para '/iniciar_sesion'
    const { correo, contraseña } = req.body; // Extrae 'correo' y 'contraseña' del cuerpo de la solicitud

    // Define la consulta SQL para obtener el rol del usuario que coincida con el correo y la contraseña
    const query = 'SELECT rol FROM HeladeriaUsuarios WHERE correo = ? AND contraseña = ?';

    // Ejecuta la consulta SQL con los valores de 'correo' y 'contraseña'
    connection.query(query, [correo, contraseña], (err, results) => {
        if (err) { // Si hay un error en la consulta
            console.error('Error al iniciar sesión:', err); // Imprime el error en la consola
            res.send('Error al iniciar sesión'); // Envía una respuesta de error al cliente
        } else if (results.length > 0) { // Si la consulta devuelve al menos un resultado
            const rol = results[0].rol; // Obtiene el rol del usuario del primer resultado
            if (rol === 1) { // Si el rol es 1 (administrador)
                res.redirect('/administrador.html'); // Redirige a la página del administrador
            } else if (rol === 2) { // Si el rol es 2 (usuario normal)
                res.redirect('/usuario.html'); // Redirige a la página del usuario
            }
        } else { // Si no se encuentra ningún usuario con las credenciales proporcionadas
            res.send('Correo o clave incorrectos'); // Envía una respuesta indicando que las credenciales son incorrectas
        }
    });
});

// Nueva ruta para eliminar un usuario
app.delete('/eliminar_helado/:id', (req, res) => {
    const { id } = req.params;

    const query = 'DELETE FROM Helado WHERE id = ?';
    connection.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error al eliminar el helado:', err);
            res.status(500).send('Error al eliminar el helado');
        } else {
            res.status(200).send('helado eliminado exitosamente');
        }
    });
})

app.use(express.urlencoded({ extended: true }));
// Servir archivos estáticos de la carpeta 'imagenes'
app.use('/imagenes', express.static(path.join(__dirname, 'imagenes')));

// Ruta para servir el formulario HTML
app.use(express.static(path.join(__dirname, 'pagina_principal')));

// Ruta para manejar la subida de imágenes
app.post('/subir_imagenes', upload.single('imagen'), (req, res) => {
    // Extrae 'nombre' y 'descripcion' del cuerpo de la solicitud
    const { nombre, descripcion } = req.body;
    // Extrae el nombre del archivo subido desde la solicitud
    const imagen = req.file.filename;
    // Define la consulta SQL para insertar los datos en la tabla 'imagenes'
    const query = 'INSERT INTO imagenes (nombre, descripcion, imagen) VALUES (?, ?, ?)';
    // Ejecuta la consulta SQL con los valores extraídos
    connection.query(query, [nombre, descripcion, imagen], (err) => {
        // Si hay un error, lanza una excepción
        if (err) throw err;
        // Si la inserción es exitosa, redirige al usuario a la página principal
        res.redirect('/');
    });
});

// Ruta para obtener las imágenes
app.get('/imagenes', (req, res) => {
    const query = 'SELECT nombre, descripcion, imagen FROM imagenes';
    connection.query(query, (err, result) => {
        if (err) {
            console.error('Error al obtener los datos de la base de datos: ' + err.stack);
            res.status(500).send('Error al obtener los datos de la base de datos.');
            return;
        }
        res.json(result);
    });
});

//Servidor ejecutandose en el puerto 3000
app.listen(port, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});

