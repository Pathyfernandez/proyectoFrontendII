// SEGURIDAD: Si no se encuentra en localStorage info del usuario
// no lo deja acceder a la página, redirigiendo al login inmediatamente.
function isUserLoggedIn() {
  const jwt = localStorage.getItem("jwt");
  if (!jwt) {
    console.log("El usuario no está autenticado.");
    location.replace("./index.html");
    return false;
  }

  return true;
}


/* ------ comienzan las funcionalidades una vez que carga el documento ------ */
window.addEventListener('load', function () {

  /* ---------------- variables globales y llamado a funciones ---------------- */
  
  const url = "https://todo-api.ctd.academy/v1";
  const urlTareas = `${url}/tasks`;
  const urlUsuario = `${url}/users/getMe`;
  const token = JSON.parse(localStorage.jwt);

  const btnCerrarSesion = document.querySelector('#closeApp');
  const formCrearTarea = document.querySelector('.nueva-tarea');
  const nuevaTarea = document.querySelector('#nuevaTarea');
  if (!isUserLoggedIn()) {
    return;
  }
  obtenerNombreUsuario();
  consultarTareas();

  /* -------------------------------------------------------------------------- */
  /*                          FUNCIÓN 1 - Cerrar sesión                         */
  /* -------------------------------------------------------------------------- */

  btnCerrarSesion.addEventListener('click', function () {
    if (!confirm('¿Desea cerrar sesión?')) {
      return;
    }
    localStorage.removeItem('jwt');
    location.replace('./index.html');
  });
  

  /* -------------------------------------------------------------------------- */
  /*                 FUNCIÓN 2 - Obtener nombre de usuario [GET]                */
  /* -------------------------------------------------------------------------- */

  function obtenerNombreUsuario() {
    if (!isUserLoggedIn()) {
      return;
    }
    const settings = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };
    console.log('Consultando mi usuario a la API...');
    fetch(urlUsuario, settings)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(response.statusText);
        }
      })
      .then(data => {
        console.log(data.firstName);
        const nombreUsuario = document.querySelector('.user-info p');
        nombreUsuario.textContent = data.firstName;
      })
      .catch(error => {
        console.log(error);
      });
  }
  

  /* -------------------------------------------------------------------------- */
  /*                 FUNCIÓN 3 - Obtener listado de tareas [GET]                */
  /* -------------------------------------------------------------------------- */

  function consultarTareas() {
    if (!isUserLoggedIn()) {
      return;
    }
  
    const settings = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    };
    console.log('Consultando tareas');
    fetch(urlTareas, settings)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error(response.statusText);
        }
      })
      .then(tareas => {
        console.log('Tareas del usuario');
        console.log(tareas);
  
        renderizarTareas(tareas);
        botonesCambioEstado(tareas);
        botonBorrarTarea(tareas);
      })
      .catch(error => {
        console.log(error);
      });
  }
  

  /* -------------------------------------------------------------------------- */
  /*                    FUNCIÓN 4 - Crear nueva tarea [POST]                    */
  /* -------------------------------------------------------------------------- */

  formCrearTarea.addEventListener('submit', function (e) {
    e.preventDefault();
  
    console.log('Creando una nueva tarea...');
    const nuevaTareaValue = nuevaTarea.value.trim();
    if (!nuevaTareaValue) {
      console.log('El campo de la nueva tarea no puede estar vacío.');
      return;
    }
    const newTask = {
      title: nuevaTareaValue,
    };
    fetch(urlTareas, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTask),
    })
      .then(response => response.json())
      .then(task => {
        if (task.success) {
          console.log('Tarea creada correctamente.');
          consultarTareas();
        } else {
          console.log('Error al crear la tarea.');
        }
      })
      .catch(error => {
        console.log(error);
      });
    formCrearTarea.reset();
  });
  

  /* -------------------------------------------------------------------------- */
  /*                  FUNCIÓN 5 - Renderizar tareas en pantalla                 */
  /* -------------------------------------------------------------------------- */
  function renderizarTareas(tareas) {
    console.log(tareas);
  
    // Obtengo los listados de tareas.
    const tareasPendientes = document.querySelector('.tareas-pendientes');
    const tareasTerminadas = document.querySelector('.tareas-terminadas');
  
    // Limpio cualquier contenido interno de los listados.
    tareasPendientes.innerHTML = '';
    tareasTerminadas.innerHTML = '';
  
    // Obtengo el número de tareas finalizadas.
    const numeroFinalizadas = document.querySelector('#cantidad-finalizadas');
    let contador = 0;
  
    // Itero por las tareas.
    tareas.forEach(tarea => {
      // Creo una fecha a partir de la fecha de creación de la tarea.
      let fecha = new Date(tarea.createdAt);
  
      // Incremento el contador de tareas finalizadas si la tarea está completada.
      if (tarea.completed) {
        contador++;
      }
  
      // Creo un elemento HTML para la tarea.
      const tareaElement = document.createElement('li');
      tareaElement.classList.add('tarea');
  
      // Agrego un icono de tarea completada si la tarea está completada.
      if (tarea.completed) {
        tareaElement.innerHTML += `
          <div class="hecha">
            <i class="fa-regular fa-circle-check"></i>
          </div>
        `;
      }
  
      // Agrego una descripción de la tarea.
      tareaElement.innerHTML += `
        <div class="descripcion">
          <p class="nombre">${tarea.description}</p>
          <p class="timestamp">${fecha.toLocaleDateString()}</p>
        </div>
      `;
  
      // Agrego botones de cambio de estado y borrado si la tarea no está completada.
      if (!tarea.completed) {
        tareaElement.innerHTML += `
          <div class="cambios-estados">
            <button class="change incompleta" id="${tarea.id}" ><i class="fa-solid fa-rotate-left"></i></button>
            <button class="borrar" id="${tarea.id}"><i class="fa-regular fa-trash-can"></i></button>
          </div>
        `;
      }
  
      // Agrego el elemento HTML a la lista de tareas correspondiente.
      if (tarea.completed) {
        tareasTerminadas.appendChild(tareaElement);
      } else {
        tareasPendientes.appendChild(tareaElement);
      }
    });
  
    // Actualizo el número de tareas finalizadas en la interfaz de usuario.
    numeroFinalizadas.textContent = contador;
  }  

  /* -------------------------------------------------------------------------- */
  /*                  FUNCIÓN 6 - Cambiar estado de tarea [PUT]                 */
  /* -------------------------------------------------------------------------- */
  function botonesCambioEstado() {
    const btnCambioEstado = document.querySelectorAll('.change');
  
    btnCambioEstado.forEach(boton => {
      // A cada botón le asignamos una funcionalidad
      boton.addEventListener('click', async (e) => {
        console.log('Cambiando estado de tarea...');
  
        const id = e.target.id;
        const url = `${urlTareas}/${id}`;
        const payload = {
          completed: !e.target.classList.contains('incompleta'),
        };
  
        const settingsCambio = {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        };
  
        const response = await fetch(url, settingsCambio);
  
        if (response.ok) {
          console.log('Tarea actualizada correctamente.');
          consultarTareas();
        } else {
          console.log('Error al actualizar la tarea.');
        }
      });
    });
  }
  


  /* -------------------------------------------------------------------------- */
  /*                     FUNCIÓN 7 - Eliminar tarea [DELETE]                    */
  /* -------------------------------------------------------------------------- */
  function botonBorrarTarea() {
    const btnBorrarTarea = document.querySelectorAll('.borrar');

    btnBorrarTarea.forEach(boton => {
      // A cada botón le asignamos una funcionalidad
      boton.addEventListener('click', async (e) => {
        console.log('Eliminando tarea...');
  
        const id = e.target.id;
        const url = `${urlTareas}/${id}`;
  
        const settings = {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        };
  
        const response = await fetch(url, settings);
  
        if (response.ok) {
          console.log('Tarea eliminada correctamente.');
          consultarTareas();
        } else {
          console.log('Error al eliminar la tarea.');
        }
      });
    });
  };

});