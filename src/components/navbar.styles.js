const sheet = new CSSStyleSheet();
sheet.replaceSync(`
    nav {
        width: calc(100% - 1rem);
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
        justify-content: center;
        position: relative;
        overflow: hidden;
        transition: height 500ms ease;
    }

    .navigation__container {
        flex: 1;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .navigation__menu {
        right: 2rem;
        cursor: pointer;
        width: 48px;
        display: none;
    }

    .navigation__logo img {
        width: 96px;
    }

    .navigation__options {
        flex: 1;
        text-align: center;
        height: 100%;
    }

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
        color: var(--dark-color);
        font-family: var(--tipography), "sans-serif";
        font-size: 1.1rem;
        transition: all 250ms ease;
    }

    .navigation__options .navigation__link:hover {
        color: var(--light-color);
        text-shadow: 0 0 3px var(--light-color);
    }

    .navigation__options .navigation__link:hover > .navigation__icon {
        filter: drop-shadow(0 0 3px var(--dark-color)) invert(1);
    }

    .navigation__options .navigation__link::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--navbar-selected-color);
        border-radius: 5px;
        opacity: 0;
        z-index: -1;
        transition: all 250ms ease;
    }

    .navigation__link:hover::after {
        opacity: .4;
    }

    .navigation__account .navigation__link {
        padding: 0;
        margin: 0 10px;
    }

    .navigation__account .navigation__link:hover {
        text-shadow: 0 0 3px var(--dark-color);
    }

    .navigation__account .navigation__link:hover > .navigation__icon {
        filter: drop-shadow(0 0 3px var(--dark-color));
    }

    .navigation__account .navigation__link::after {
        content: "";
        position: absolute;
        bottom: -5px;
        left: 0;
        height: 2px;
        width: 0;
        background-color: var(--dark-color);
        transition: all 350ms ease;
    }

    .navigation__account .navigation__link:hover::after {
        width: 100%;
    }

    @media (max-width: 1280px) {
        .navigation__link {
            font-size: .8rem;
            padding: 0 10px;
        }

        .navigation__icon {
            width: 24px;
        }
    }

    @media (max-width: 1000px) {
        .navigation {
            flex-direction: column;
        }
        
        .navigation__container {
            width: 100%;
            padding-top: 1rem;
        }

        .navigation__options {
            text-align: left;
        }
    }

    @media (max-width: 900px) {
        .navigation__link {
            font-size: .6rem;
        }

        .navigation__icon {
            width: 24px;
        }
    }

    @media (max-width: 790px) {
        .navigation {
            align-items: flex-start;
            height: 100px;
        }

        .navigation__container {
            height: 0;
            flex-direction: column;
            align-items: flex-start;
            overflow: hidden;
        }

        .navigation__link {
            display: block;
            font-size: 2rem;
            padding: 10px;
            height: auto;
        }

        .navigation__icon {
            width: 32px;
        }

        .navigation__options {
            width: 100%;
        }

        .navigation__account {
            width: 100%;
            border-top: 3px solid #333333ab;
            padding: 10px 0;
            margin-top: 10px;
        }

        .navigation__account .navigation__link {
            padding: .6rem;
            margin-bottom: 5px;
        }

        .navigation__account .navigation__link::after {
            top: 0;
            left: 0;
            background-color: var(--navbar-selected-color);
            opacity: 0;
            width: 100%;
            height: 100%;
            border-radius: 10px;
            z-index: -1;
        } 

        .navigation__account .navigation__link:hover::after {
            opacity: .6;
        }

        .navigation__account .navigation__link:hover {
            color: var(--light-color);
            text-shadow: 0 0 3px var(--light-color);
        }

        .navigation__account .navigation__link:hover > .navigation__icon {
            filter: drop-shadow(0 0 3px var(--dark-color)) invert(1);
        }

        .navigation__menu {
            display: block;
            position: absolute;
            top: 2rem;
            right: 2.5rem;
        }

        .navigation--active {
            height: 650px;
        }
    }
`);

export default sheet;
