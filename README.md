# romulo-website
Sitio web oficial de la institución pública de educación media "Liceo Nacional Don Rómulo Gallegos"

---

## Tabla de contenido
- [Herramientas necesarias](#herramientas-necesarias)
- [Instalación de git](#instalación-de-git)
- [Clonar repositorio](#clonar-repositorio)
- [Estructura de carpetas del proyecto](#estructura-de-carpetas-del-proyecto)
    - [Directorio /app](#directorio-app)
    - [Directorio /src](#directorio-src)
    - [Directorio /src/assets](#directorio-srcassets)
    - [Directorio /src/components](#directorio-srccomponents)
    - [Directorio /src/layouts](#directorio-srclayouts)
    - [Directorio /src/scripts](#directorio-srcscripts)
    - [Directorio /src/styles](#directorio-srcstyles)

---

## Herramientas necesarias
- Cualquier editor de código de tu preferencia.
- Un navegador web.
- Git
- Github
- Instalar las siguientes extensiones de Visual Studio Code:
    - [Live server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer)
    - [lit-plugin](https://marketplace.visualstudio.com/items?itemName=runem.lit-plugin)
    - [Prettier - Code formatter (opcional)](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

---

## Instalación de Git
Si utilizas windows 11 y Powershell, puedes ejecutar el siguiente comando para descargar e instalar rápidamente git (requiere de la herramienta winget):

```
winget install --id Git.Git -e --source winget
```

En caso de correr Windows 10 o no tener Powershell o winget instalados, debes descargar el instalador a través de la página oficial de git.

[Sitio web oficial de Git](https://git-scm.com/)

Ejecuta el instalador como administrador y sigue el proceso de instalación

Si todo salió bien, abre la terminal de línea de comandos de tu sistema operativo y ejecuta el siguiente comando:

```
git --version
```

Si la salida es parecido a la siguiente, tienes instalado git correctamente:

```
git version 2.51.0
```

Configura tu git ejecutando los siguientes comandos:

```
git config --global user.email "<correo electrónico de github>"
git config --global user.name "<nombre de usuario de github>"
```

NOTA: Recuerda reemplazar todo el contenido dentro de los corchetes angulares <> con lo indicado en la leyenda.

---
## Clonar repositorio
Para comenzar a aportar código en este proyecto, debes clonar el presente repositorio con la herramienta de terminal Git o alguna herramienta GUI de Git. Para ello, ejecuta el siguiente comando en la terminal de línea de comandos de tu sistema operativo:

```
git clone https://github.com/edgarchacinweb/romulo-website.git
```

Recuerda importar la carpeta del proyecto a tu editor de código de preferencia y correr Live Server, de esta forma obtendras un servidor local para desarrollo. Al ejecutar la extensión de Live Server, se abrirá una ventana en tu navegador web de confianza con la aplicación web corriendo.

Es necesario ejecutar esta aplicación web en un servidor para que se ejecuten correctamente los web components.

---

## Estructura de carpetas del proyecto

Para este proyecto, se optó por utilizar una arquitectura monolítica para el frontend utilizando código nativo de Javascript (Vanilla) en lugar de frameworks, por lo que los desarrolladores y mantenedores del proyecto cuentan con la total libertad creativa para organizar los distintos recursos de este proyecto.

Se decidió utilizar la siguiente estructura de carpetas debido a su facilidad y flexibilidad de desarrollo, la cuál es realmente auto-explicativa y sencilla de mantener. A continuación, se dará un breve vistazo y explicación de la estructura de carpetas elegida para el proyecto

```
.
├── app
├── index.html
├── README.md
├── .gitignore
└── src
    ├── assets
    │   ├── fonts
    │   ├── icons
    │   └── images
    ├── components
    ├── layouts
    ├── scripts
    └── styles

```

### Directorio /app

Contiene todas las páginas que conforma la aplicación web, menos la página principal "index.html". Toda página de la aplicación debe estar en este directorio.

Procura crear subdirectorios para agrupar diferentes páginas de cada proceso. Por ejemplo, lo siguiente:

```
.
└── app
    ├── docentes
    │   ├── index.html
    │   ├── registrar.html
    │   ├── editar.html
    │   └── eliminar.html
    ├── estudiantes
    │   ├── index.html
    │   ├── asistencia.html
    │   └── registrar.html
    └── Horarios
        ├── index.html
        ├── registrar.html
        └── eliminar.html
```

NOTA: Tomar el esquema presentado como un simple ejemplo

### Directorio /src

Contiene todos los recursos de la aplicación.

### Directorio /src/assets

Contiene todos los recursos multimedia de la aplicación, está compuesta por los siguientes subdirectorios:

- **fonts**: Contiene las fuentes o tipografías utilizadas en la aplicación.
- **icons**: Contiene todos los iconos que se utilizados en la aplicación.
- **images**: Contiene todos los recursos fotográficos de la aplicación.
- **videos**: Contiene todos los recursos audiovisuales de la aplicación.

### Directorio /src/components

Contiene todos los componentes utilizados en la aplicación.

Un componente web (web component) es una pieza de código reutilizable escrita en HTML, CSS Y Javascript, permite la reutilización de funcionalidad común.

Ejemplos de web components:

- Botones
- Campos de formularios
- Menus

Todos estas funcionalidad comparten algo en común, suelen ser utilizados varias veces en una o várias páginas web de la aplicación. Por esa razón se suelen agrupar en componentes, para poder reutilizarlos fácilmente a través de una única etiqueta HTML personalizada.

Para crear un componente, debes crear un directorio con el nombre del componente, dentro estarán los archivos de código fuente del componente web.

```
.
└── components
    ├── navbar
    │   ├── navbar.component.js
    │   └── navbar.styles.js
    ├── styledButton
    │   ├── styledButton.component.js
    │   └── styledButton.styles.js
    └── slider
        ├── slider.component.js
        └── slider.styles.js
```

Se recomienda separar los estilos del componente y el código del componente como tal en archivos separados para facilitar el proceso de depuración del código.

Nota la nomenclatura utilizada para los componentes web

```
<nombre del component>.component.js
<nombre del component>.styles.js
```

Esta nomenclatura facilita la depuración de código, ya que es fácil de identificar cuándo un componente está fallando, ya que las herramientas de desarrollador de tu navegador de confianza te mostrarán, como mínimo, el nombre del script de Javascript que falló, mostrando claramente que es un componente o los estilos del componente.

### Directorio /src/layouts

Un layout permite compartir funcionalidad común en muchas páginas de la aplicación. Aunque la sintaxis es identica a la de un componente, tiene sus diferencias clave.

- **No es una pequeña pieza de código reutilizable**: A diferencia de lso componentes web, los layouts no buscan la reutilización de una única funcionalidad o elemento personalizado de una página web.
- **Definen la estructura de una página web**: Los layouts se utilizan para compartir maquetación común en várias páginas de la aplicación web. Por ejemplo, si muchas páginas utilizan una estructura de un menu lateral, estilos de espaciados común, y una sección específica dónde siempre se va a inyectar el código específico de la página web, se puede definir un layout para reutilizar esa estructura completa en una página web simplemente utilizando una etiqueta de HTML personalizada.
- **Es una plantilla para una página web**: La principal diferencia radica en el ámbito de cada uno, un componente web es una plantilla para un elemento personalizado, mientras que un layout es una plantilla para la estructura de una página web completa.

Los layouts son útiles porque nos permiten automatizar el procesos de actualización y mantenimiento a largo plazo de una aplicación web. Por ejemplo, si la estructura compartida de la aplicación web cambia, no es necesario actualizar la estructura en todas las páginas que las integran, solo se actualiza el código del Layout, y listo, se actualiza la estructura de todos las páginas que utilizan ese layout.

Utiliza las mismas convenciones que un componente, con la única diferencia que cambia la palabra clave "component" por "layout"

```
<nombre del layout>.layout.js
<nombre del layout>.styles.js
```

### Directorio /src/scripts

Aquí están todos los scripts que no están vinculados a ningún componente, por ejemplo, helpers o funciones de ayuda que ayudan a procesar pequeños conjuntos de datos. Por ejemplo, funciones para validar datos.

### Directorio /src/styles

Aquí están todos los estilos de CSS globales de la aplicación. Se colocan archivos de CSS con código que no está vinculado a ningún componente, pero que será compartido a lo largo de la mayoría o toda la aplicación web. De esta forma, se evita definir siempre las mismas reglas de CSS para aplicar estilos comunes.