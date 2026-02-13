const sheet = new CSSStyleSheet();
sheet.replaceSync(`
    nav {
        width: calc(100% - 2rem);
        min-height: 120px;
        margin: .5rem;
        padding: .4rem 2rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(9px);
        -webkit-backdrop-filter: blur(9px);
        border: 1px solid #212121;
        box-shadow: 0 6px 6px 2px #333333ab;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        /* Cambiado para separar logo de botones */
        justify-content: space-between; 
        position: relative;
        overflow: hidden;
        transition: height 500ms ease;
    }

    .navigation__container {
        /* Eliminamos flex:1 para que no empuje todo al centro */
        display: flex;
        justify-content: flex-end;
        align-items: center;
    }

    .navigation__logo img {
        width: 96px;
    }

    /* Estilos base para los links que quedan */
    .navigation__link {
        display: inline-flex;
        align-items: center;
        height: 100%;
        justify-content: center;
        padding: 0 1rem;
        position: relative;
        gap: 5px;
        z-index: 100;
        text-decoration: none;
        color: var(--light-color);
        font-family: var(--tipography), "sans-serif";
        font-size: 1.1rem;
        transition: all 250ms ease;
    }

    .navigation__account .navigation__link {
        padding: 0;
        margin: 0 10px;
    }

    .navigation__account .navigation__link:hover {
        text-shadow: 0 0 3px var(--dark-color);
    }

    /* Efecto de línea debajo de los botones de cuenta */
    .navigation__account .navigation__link::after {
        content: "";
        position: absolute;
        bottom: -5px;
        left: 0;
        height: 2px;
        width: 0;
        background-color: var(--light-color);
        transition: all 350ms ease;
    }

    .navigation__account .navigation__link:hover::after {
        width: 100%;
    }

    /* Responsivo para móviles */
    @media (max-width: 790px) {
        .navigation {
            align-items: flex-start;
            height: 100px;
            justify-content: flex-start;
        }

        .navigation__container {
            height: 0;
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
            overflow: hidden;
        }

        .navigation--active {
            height: 250px; /* Reducido porque ya hay menos opciones */
        }

        .navigation__menu {
            display: block;
            position: absolute;
            top: 2rem;
            right: 2.5rem;
            width: 48px;
            cursor: pointer;
        }
    }
`);

export default sheet;
