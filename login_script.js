
    function login(token) {
        setInterval(() => {
            document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token = token;
        }, 50);
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    login("MTI5MDczMjI1MjkwODQ4Njc0Ng.GgQht1.iC2-B8KG7q4qpbhusfyJFSvhUaysWz60DPQ7oA");
    