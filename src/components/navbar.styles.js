const sheet = new CSSStyleSheet();
sheet.replaceSync(`
    nav {
        width: calc(100% - 1rem);
        margin: .5rem;
        padding: 1rem;
        border-radius: 1rem;
        background-color: #ffffff;
        border: 1px solid #212121;
        box-shadow: 0 6px 6px 2px #333333ab;
        box-sizing: border-box;
    }
`);

export default sheet;