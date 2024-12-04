document.addEventListener('DOMContentLoaded', () => {
    let fieldCount = 1; // Contador para los campos dinámicos de MongoDB

    // Función para obtener los registros de MySQL
    function getMysqlData() {
        fetch('/get_mysql')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#mysql-table tbody');
                tableBody.innerHTML = '';
                data.forEach(record => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${record.id}</td>
                        <td>${record.name}</td>
                        <td>${record.description}</td>
                        <td>
                            <button class="update-btn" data-id="${record.id}">Actualizar</button>
                            <button class="delete-btn" data-id="${record.id}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Agregar eventos para actualizar y eliminar
                document.querySelectorAll('.update-btn').forEach(button => {
                    button.addEventListener('click', updateMysqlRecord);
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', deleteMysqlRecord);
                });
            });
    }

    // Función para obtener los registros de MongoDB
    function getMongoData() {
        fetch('/get_mongo')
            .then(response => response.json())
            .then(data => {
                const tableBody = document.querySelector('#mongo-table tbody');
                tableBody.innerHTML = '';
                data.forEach(record => {
                    const fieldCell = document.createElement('td');
                    const fields = Object.keys(record)
                        .filter(key => key !== '_id') // Excluir el campo `_id`
                        .map(key => key)  // Solo el nombre del campo
                        .join('<br>');  // Los campos separados por un salto de línea
                    fieldCell.innerHTML = fields;

                    // Columna de valores
                    const valueCell = document.createElement('td');
                    const values = Object.keys(record)
                        .filter(key => key !== '_id') // Excluir el campo `_id`
                        .map(key => record[key])  // Los valores de cada campo
                        .join('<br>');  // Los valores separados por un salto de línea
                    valueCell.innerHTML = values;
                        
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${record._id}</td>
                        <td>${fields}</td>
                        <td>${values}</td>
                        <td>
                            <button class="update-btn-mongo" data-id="${record._id}">Actualizar</button>
                            <button class="delete-btn" data-id="${record._id}">Eliminar</button>
                        </td>
                    `;
                    tableBody.appendChild(row);
                });

                // Agregar eventos para actualizar y eliminar
                document.querySelectorAll('.update-btn-mongo').forEach(button => {
                    button.addEventListener('click', updateMongoRecord);
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', deleteMongoRecord);
                });
            });
    }

    // Cargar los datos al iniciar la página
    getMysqlData();
    getMongoData();

    // Manejo del formulario de agregar registros para MySQL
    const addMysqlForm = document.querySelector('#add-mysql-form');
    addMysqlForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const name = document.querySelector('#mysql-name').value;
        const description = document.querySelector('#mysql-description').value;

        const data = { name, description };

        fetch('/add_mysql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(response => response.json()).then(() => {
            getMysqlData(); // Recargar la tabla de MySQL
        });

        addMysqlForm.reset();
    });

    // Manejo del formulario de agregar registros dinámicos para MongoDB
    document.querySelector('#add-mongo-form').addEventListener('submit', (event) => {
        event.preventDefault();

        const data = {};
        for (let i = 1; i <= fieldCount; i++) {
            const key = document.getElementById(`mongo-key-${i}`).value;
            const value = document.getElementById(`mongo-value-${i}`).value;
            if (key) {
                data[key] = value;
            }
        }

        fetch('/add_mongo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(response => response.json()).then(() => {
            getMongoData(); // Recargar tabla de MongoDB

            // Reiniciar formulario dinámico
            const fieldsDiv = document.getElementById('mongo-fields');
            fieldsDiv.innerHTML = `
                <div class="field-row">
                    <input type="text" id="mongo-key-1" placeholder="Nombre del campo">
                    <input type="text" id="mongo-value-1" placeholder="Valor del campo">
                </div>
            `;
            fieldCount = 1;
        });
    });

    // Agregar más campos dinámicos al formulario de MongoDB
    document.getElementById('add-field').addEventListener('click', () => {
        fieldCount++;
        const fieldsDiv = document.getElementById('mongo-fields');
        const newFieldRow = document.createElement('div');
        newFieldRow.className = 'field-row';
        newFieldRow.innerHTML = `
            <input type="text" id="mongo-key-${fieldCount}" placeholder="Nombre del campo">
            <input type="text" id="mongo-value-${fieldCount}" placeholder="Valor del campo">
        `;
        fieldsDiv.appendChild(newFieldRow);
    });

    // Función para actualizar datos en MySQL
    function updateMysqlRecord(event) {
        const id = event.target.getAttribute('data-id');
        const name = prompt("Ingrese el nuevo nombre:");
        const description = prompt("Ingrese la nueva descripción:");

        const data = { name, description };

        fetch(`/update_mysql/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(response => response.json()).then(() => {
            getMysqlData(); // Recargar la tabla de MySQL
        });
    }

    // Función para actualizar datos en MongoDB
    function updateMongoRecord(event) {
        const id = event.target.getAttribute('data-id');
    
        // Obtener los datos actuales de MongoDB
        fetch(`/get_mongo/${id}`)
            .then(response => response.json())
            .then(record => {
                const updatedData = {};
    
                // Preguntar por los nuevos valores para cada campo
                Object.keys(record).forEach(key => {
                    if (key !== '_id') {
                        const newValue = prompt(`Ingrese el nuevo valor para ${key}:`, record[key]);
                        if (newValue !== null && newValue !== record[key]) {
                            updatedData[key] = newValue;
                        }
                    }
                });
    
                // Solo hacer la solicitud de actualización si hay datos para actualizar
                if (Object.keys(updatedData).length > 0) {
                    fetch(`/update_mongo/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedData),
                    })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Error al actualizar el registro');
                        }
                        return response.json();
                    })
                    .then(() => {
                        // Recargar la tabla de MongoDB después de la actualización
                        getMongoData();
                    })
                    .catch(error => {
                        alert(`Hubo un error: ${error.message}`);
                    });
                } else {
                    alert("No se hicieron cambios en el registro.");
                }
            })
            .catch(error => {
                alert(`Error al obtener los datos: ${error.message}`);
            });
    }
    

    // Función para eliminar datos en MySQL
    function deleteMysqlRecord(event) {
        const id = event.target.getAttribute('data-id');

        fetch(`/delete_mysql/${id}`, {
            method: 'DELETE'
        }).then(response => response.json()).then(() => {
            getMysqlData(); // Recargar la tabla de MySQL
        });
    }

    // Función para eliminar datos en MongoDB
    function deleteMongoRecord(event) {
        const id = event.target.getAttribute('data-id');

        fetch(`/delete_mongo/${id}`, {
            method: 'DELETE'
        }).then(response => response.json()).then(() => {
            getMongoData(); // Recargar la tabla de MongoDB
        });
    }
});
